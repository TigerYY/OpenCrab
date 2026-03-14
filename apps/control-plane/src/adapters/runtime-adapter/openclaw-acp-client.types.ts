export type AcpErrorCode =
  | "ACP_TIMEOUT"
  | "ACP_UNAVAILABLE"
  | "ACP_BAD_RESPONSE"
  | "ACP_HTTP_4XX"
  | "ACP_HTTP_5XX";

export class AcpClientError extends Error {
  constructor(
    public readonly code: AcpErrorCode,
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AcpClientError";
  }
}

export type AcpCreateSessionRequest = {
  runtimeSessionRef: string;
  sessionId: string;
  workspaceId: string;
  userId: string;
  channelType: string;
};

export type AcpCreateSessionResponse = {
  runtimeSessionRef?: string;
  sessionKey?: string;
};

export type AcpInvokeRequest = {
  workspaceId: string;
  taskType: string;
  prompt: string;
};

export type AcpInvokeResponse = {
  answer?: string;
  model?: string;
};
