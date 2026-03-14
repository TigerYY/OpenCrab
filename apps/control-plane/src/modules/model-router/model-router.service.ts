import { Injectable } from "@nestjs/common";

import { RuntimeAdapterService } from "../../adapters/runtime-adapter/runtime-adapter.service";
import { ModelDecideDto } from "./dto/model-decide.dto";
import { ModelInvokeDto } from "./dto/model-invoke.dto";
import { ModelRouterRepository } from "./model-router.repository";

@Injectable()
export class ModelRouterService {
  constructor(
    private readonly modelRouterRepository: ModelRouterRepository,
    private readonly runtimeAdapterService: RuntimeAdapterService
  ) {}

  decide(input: ModelDecideDto) {
    const useExternalFallback =
      input.fallbackAllowed && input.sensitivity !== "restricted";

    return {
      provider: "local-gateway",
      deployment: "qwen-internal",
      decision: "allow",
      fallbackChain: useExternalFallback
        ? ["qwen-internal", "external-claude"]
        : ["qwen-internal"]
    };
  }

  async invoke(input: ModelInvokeDto) {
    if (input.sensitivity === "restricted") {
      if (this.modelRouterRepository.isDbEnabled()) {
        await this.modelRouterRepository.logInvocation({
          workspaceId: input.workspaceId,
          taskType: input.taskType,
          sensitivity: input.sensitivity,
          model: "external-claude",
          decision: "pending_approval"
        });
      }
      return {
        code: "PENDING_APPROVAL",
        message: "restricted outbound requires approval",
        data: {
          approvalTicketId: `apv_${Date.now()}`
        }
      };
    }

    if (this.modelRouterRepository.isDbEnabled()) {
      await this.modelRouterRepository.logInvocation({
        workspaceId: input.workspaceId,
        taskType: input.taskType,
        sensitivity: input.sensitivity,
        model: "qwen-internal",
        decision: "allow"
      });
    }

    return {
      code: "OK",
      message: "success",
      data: {
        ...(await this.runtimeAdapterService.execute({
          workspaceId: input.workspaceId,
          taskType: input.taskType,
          prompt: input.prompt
        }))
      }
    };
  }
}
