import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { ListPrReviewJobsDto } from "./dto/list-pr-review-jobs.dto";
import { PrWebhookDto } from "./dto/pr-webhook.dto";
import { IntegrationsService } from "./integrations.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post("pr-review/webhook")
  async prReviewWebhook(@Req() req: Request, @Body() body: PrWebhookDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.enqueuePrReview(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("pr-review/jobs")
  async listPrReviewJobs(@Req() req: Request, @Query() query: ListPrReviewJobsDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.listPrReviewJobs({
        workspaceId: query.workspaceId,
        status: query.status,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("pr-review/jobs/:jobId")
  async getPrReviewJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.getPrReviewJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("pr-review/jobs/:jobId/retry")
  async retryPrReviewJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.retryPrReviewJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("pr-review/jobs/:jobId/terminate")
  async terminatePrReviewJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.terminatePrReviewJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
