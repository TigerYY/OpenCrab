import { Controller, Get, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("adoption")
  async adoption(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.metricsService.getAdoption(
        workspaceId ?? req.requestContext?.workspaceId ?? "ws_default",
        from,
        to
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("quality")
  async quality(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.metricsService.getQuality(
        workspaceId ?? req.requestContext?.workspaceId ?? "ws_default",
        from,
        to
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("governance")
  async governance(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.metricsService.getGovernance(
        workspaceId ?? req.requestContext?.workspaceId ?? "ws_default",
        from,
        to
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("platform")
  async platform(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.metricsService.getPlatform(
        workspaceId ?? req.requestContext?.workspaceId ?? "ws_default",
        from,
        to
      ),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
