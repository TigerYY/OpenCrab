import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { CreateAuditEventDto } from "./dto/create-audit-event.dto";
import { RuntimeFallbackAlertQueryDto } from "./dto/runtime-fallback-alert-query.dto";
import { RuntimeFallbackQueryDto } from "./dto/runtime-fallback-query.dto";
import { AuditService } from "./audit.service";

@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post("events")
  async create(@Req() req: Request, @Body() body: CreateAuditEventDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.auditService.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("events")
  async list(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string,
    @Query("userId") userId?: string,
    @Query("eventType") eventType?: string,
    @Query("traceId") traceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.auditService.list({
        workspaceId,
        userId,
        eventType,
        traceId
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("runtime-fallback-stats")
  async runtimeFallbackStats(
    @Req() req: Request,
    @Query() query: RuntimeFallbackQueryDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.auditService.listRuntimeFallbackStats({
        workspaceId: query.workspaceId,
        days: query.days ?? 7,
        topN: query.topN ?? 5
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("runtime-fallback-trend")
  async runtimeFallbackTrend(
    @Req() req: Request,
    @Query() query: RuntimeFallbackQueryDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.auditService.listRuntimeFallbackTrend({
        workspaceId: query.workspaceId,
        days: query.days ?? 7
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("runtime-fallback-alerts")
  async runtimeFallbackAlerts(
    @Req() req: Request,
    @Query() query: RuntimeFallbackAlertQueryDto
  ) {
    const windowMinutes = query.windowMinutes ?? 60;
    const threshold = query.threshold ?? 5;
    const breaches = await this.auditService.listRuntimeFallbackAlerts({
      workspaceId: query.workspaceId,
      windowMinutes,
      threshold
    });
    return {
      code: "OK",
      message: "success",
      data: {
        windowMinutes,
        threshold,
        hasAlert: breaches.length > 0,
        breaches
      },
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
