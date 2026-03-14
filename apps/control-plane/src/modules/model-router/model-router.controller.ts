import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { AuditService } from "../audit/audit.service";
import { ModelDecideDto } from "./dto/model-decide.dto";
import { ModelInvokeDto } from "./dto/model-invoke.dto";
import { ModelRouterService } from "./model-router.service";

@Controller("model-router")
export class ModelRouterController {
  constructor(
    private readonly modelRouterService: ModelRouterService,
    private readonly auditService: AuditService
  ) {}

  @Post("decide")
  decide(@Req() req: Request, @Body() body: ModelDecideDto) {
    return {
      code: "OK",
      message: "success",
      data: this.modelRouterService.decide(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("invoke")
  async invoke(@Req() req: Request, @Body() body: ModelInvokeDto) {
    const result = await this.modelRouterService.invoke(body);
    const traceId = req.requestContext?.traceId ?? `trc_${Date.now()}`;
    const resultData = (result.data ?? {}) as {
      adapter?: string;
      fallbackReason?: string;
      model?: string;
    };
    await this.auditService.create({
      eventType: "model.invoke.runtime",
      workspaceId: body.workspaceId,
      userId: req.header("x-user-id") ?? "u_system",
      traceId,
      policyDecision: result.code,
      resourceRef: `${body.taskType}:${resultData.model ?? "unknown"}`,
      runtimeMeta: {
        taskType: body.taskType,
        model: resultData.model,
        adapter: resultData.adapter,
        fallbackReason: resultData.fallbackReason
      }
    });

    return {
      ...result,
      traceId
    };
  }
}
