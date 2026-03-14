import { Injectable } from "@nestjs/common";

import {
  AcpClientError,
  AcpCreateSessionRequest,
  AcpCreateSessionResponse,
  AcpInvokeRequest,
  AcpInvokeResponse
} from "./openclaw-acp-client.types";

@Injectable()
export class OpenclawAcpClientService {
  private readonly baseUrl = process.env.OPENCLAW_ACP_BASE_URL?.trim() ?? "";
  private readonly apiKey = process.env.OPENCLAW_ACP_API_KEY?.trim() ?? "";
  private readonly timeoutMs = Number(process.env.OPENCLAW_ACP_TIMEOUT_MS ?? "5000");
  private readonly maxAttempts = Math.max(
    1,
    Number(process.env.OPENCLAW_ACP_MAX_ATTEMPTS ?? "2")
  );
  private readonly retryBackoffMs = Math.max(
    50,
    Number(process.env.OPENCLAW_ACP_RETRY_BACKOFF_MS ?? "200")
  );

  isEnabled() {
    return this.baseUrl.length > 0;
  }

  async createSession(input: AcpCreateSessionRequest) {
    return this.callWithRetry<AcpCreateSessionRequest, AcpCreateSessionResponse>(
      "/session/create",
      input
    );
  }

  async invoke(input: AcpInvokeRequest) {
    return this.callWithRetry<AcpInvokeRequest, AcpInvokeResponse>("/invoke", input);
  }

  private async callWithRetry<TReq extends Record<string, unknown>, TRes>(
    path: string,
    payload: TReq
  ) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.callOnce<TReq, TRes>(path, payload);
      } catch (error) {
        lastError = error;
        if (!this.isRetryable(error) || attempt >= this.maxAttempts) {
          throw error;
        }
        await this.sleep(this.retryBackoffMs * attempt);
      }
    }
    throw lastError;
  }

  private async callOnce<TReq extends Record<string, unknown>, TRes>(
    path: string,
    payload: TReq
  ) {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new AcpClientError("ACP_TIMEOUT", "ACP request timed out");
        }
        throw new AcpClientError("ACP_UNAVAILABLE", "ACP upstream unreachable");
      }

      if (!response.ok) {
        if (response.status >= 500) {
          throw new AcpClientError(
            "ACP_HTTP_5XX",
            `ACP upstream 5xx: ${response.status}`,
            response.status
          );
        }
        throw new AcpClientError(
          "ACP_HTTP_4XX",
          `ACP upstream 4xx: ${response.status}`,
          response.status
        );
      }

      const json = (await response.json()) as unknown;
      if (!json || typeof json !== "object") {
        throw new AcpClientError("ACP_BAD_RESPONSE", "ACP returned invalid JSON");
      }
      return json as TRes;
    } finally {
      clearTimeout(timer);
    }
  }

  private isRetryable(error: unknown) {
    if (!(error instanceof AcpClientError)) return false;
    return (
      error.code === "ACP_TIMEOUT" ||
      error.code === "ACP_UNAVAILABLE" ||
      error.code === "ACP_HTTP_5XX"
    );
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
