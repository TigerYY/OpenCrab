import { Injectable } from "@nestjs/common";

import { RuntimeAdapterService } from "../../adapters/runtime-adapter/runtime-adapter.service";
import { CreateSessionContextDto } from "./dto/create-session-context.dto";

@Injectable()
export class SessionService {
  constructor(private readonly runtimeAdapterService: RuntimeAdapterService) {}

  async createContext(input: CreateSessionContextDto) {
    const sessionId = `sess_${Date.now()}`;
    const runtimeSession = await this.runtimeAdapterService.createSession({
      sessionId,
      workspaceId: input.workspaceId,
      userId: input.userId,
      channelType: input.channelType
    });
    return {
      sessionId,
      runtimeSessionRef: runtimeSession.runtimeSessionRef,
      userId: input.userId,
      workspaceId: input.workspaceId,
      channelType: input.channelType,
      resourceContext: input.resourceContext ?? {},
      policyContext: {
        modelPolicyId: "mp_default",
        toolPolicyId: "tp_default"
      }
    };
  }
}
