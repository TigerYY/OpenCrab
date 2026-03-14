import { Injectable } from "@nestjs/common";

import { AcpClientError } from "./openclaw-acp-client.types";
import { OpenclawAcpClientService } from "./openclaw-acp-client.service";

type RuntimeSession = {
  runtimeSessionRef: string;
  sessionId: string;
  workspaceId: string;
  userId: string;
  channelType: string;
  createdAt: string;
};

@Injectable()
export class RuntimeAdapterService {
  constructor(private readonly openclawAcpClient: OpenclawAcpClientService) {}

  private readonly sessions = new Map<string, RuntimeSession>();

  async createSession(input: {
    sessionId: string;
    workspaceId: string;
    userId: string;
    channelType: string;
  }) {
    const runtimeSessionRef = `rt_${input.sessionId}`;
    const session: RuntimeSession = {
      runtimeSessionRef,
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      channelType: input.channelType,
      createdAt: new Date().toISOString()
    };
    this.sessions.set(runtimeSessionRef, session);

    if (this.openclawAcpClient.isEnabled()) {
      try {
        const response = await this.openclawAcpClient.createSession({
          runtimeSessionRef,
          sessionId: input.sessionId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          channelType: input.channelType
        });
        if (typeof response.runtimeSessionRef === "string") {
          session.runtimeSessionRef = response.runtimeSessionRef;
        }
      } catch {
        // Keep control-plane available even if upstream ACP is unreachable.
      }
    }
    return session;
  }

  async execute(input: {
    workspaceId: string;
    taskType: string;
    prompt: string;
  }) {
    if (this.openclawAcpClient.isEnabled()) {
      try {
        const response = await this.openclawAcpClient.invoke({
          workspaceId: input.workspaceId,
          taskType: input.taskType,
          prompt: input.prompt
        });
        return {
          answer:
            typeof response.answer === "string"
              ? response.answer
              : `ACP response for taskType=${input.taskType}`,
          model:
            typeof response.model === "string" ? response.model : "qwen-internal",
          adapter: "openclaw-runtime-adapter-acp"
        };
      } catch (error) {
        const fallbackReason =
          error instanceof AcpClientError ? error.code : "ACP_UNKNOWN";
        // Fallback to local stub result when ACP call fails.
        return {
          answer: `Mock response for taskType=${input.taskType}`,
          model: "qwen-internal",
          adapter: "openclaw-runtime-adapter-stub",
          fallbackReason
        };
      }
    }

    return {
      answer: `Mock response for taskType=${input.taskType}`,
      model: "qwen-internal",
      adapter: "openclaw-runtime-adapter-stub"
    };
  }
}
