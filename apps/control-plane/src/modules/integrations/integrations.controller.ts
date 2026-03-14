import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { Request } from "express";

import { CreatePrReviewConfigDto } from "./dto/create-pr-review-config.dto";
import { ListPrReviewJobsDto } from "./dto/list-pr-review-jobs.dto";
import { PrWebhookDto } from "./dto/pr-webhook.dto";
import { UpdatePrReviewConfigDto } from "./dto/update-pr-review-config.dto";
import { IntegrationsService } from "./integrations.service";
import { PrReviewConfigService } from "./pr-review-config.service";

@Controller("integrations")
export class IntegrationsController {
  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly prReviewConfigService: PrReviewConfigService
  ) {}

  @Get("pr-review/configs")
  async listPrReviewConfigs(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.prReviewConfigService.list(workspaceId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("pr-review/configs")
  async createPrReviewConfig(
    @Req() req: Request,
    @Body() body: CreatePrReviewConfigDto
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.prReviewConfigService.create(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("pr-review/configs/:configId")
  async getPrReviewConfig(
    @Req() req: Request,
    @Param("configId") configId: string
  ) {
    return {
      code: "OK",
      message: "success",
      data: await this.prReviewConfigService.getById(configId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Patch("pr-review/configs/:configId")
  async updatePrReviewConfig(
    @Req() req: Request,
    @Param("configId") configId: string,
    @Body() body: UpdatePrReviewConfigDto
  ) {
    await this.prReviewConfigService.update(configId, body);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Delete("pr-review/configs/:configId")
  async deletePrReviewConfig(
    @Req() req: Request,
    @Param("configId") configId: string
  ) {
    await this.prReviewConfigService.delete(configId);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("pr-review/results")
  async listPrReviewResults(
    @Req() req: Request,
    @Query("workspaceId") workspaceId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    const jobs = await this.integrationsService.listPrReviewJobs({
      workspaceId: workspaceId ?? "ws_default",
      limit: limit ?? 20,
      offset: offset ?? 0
    });
    const data = jobs.map((j) => ({
      ...j,
      grade: j.status === "failed" ? "critical" : j.status === "completed" ? "info" : "warning"
    }));
    return {
      code: "OK",
      message: "success",
      data,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

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

  @Post("pr-review/jobs/:jobId/resume")
  async resumePrReviewJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.integrationsService.resumePrReviewJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
