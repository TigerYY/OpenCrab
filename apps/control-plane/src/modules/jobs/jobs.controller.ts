import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req
} from "@nestjs/common";
import { Request } from "express";

import { IntegrationsService } from "../integrations/integrations.service";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { ListDeadLettersDto } from "./dto/list-dead-letters.dto";
import { ListJobsDto } from "./dto/list-jobs.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly integrationsService: IntegrationsService
  ) {}

  @Get()
  async listJobs(@Req() req: Request, @Query() query: ListJobsDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const cap = limit + offset;

    const [knowledgeJobs, prReviewJobs] = await Promise.all([
      query.jobType && query.jobType !== "knowledge"
        ? []
        : this.knowledgeService.listIndexJobs({
            workspaceId: query.workspaceId,
            status: query.status,
            limit: cap,
            offset: 0
          }),
      query.jobType && query.jobType !== "pr_review"
        ? []
        : this.integrationsService.listPrReviewJobs({
            workspaceId: query.workspaceId,
            status: query.status,
            limit: cap,
            offset: 0
          })
    ]);

    const withUnified = [
      ...knowledgeJobs.map((j: { jobId: string; [k: string]: unknown }) => ({
        ...j,
        jobType: "knowledge" as const,
        unifiedId: `knowledge:${j.jobId}`
      })),
      ...prReviewJobs.map((j: { jobId: string; [k: string]: unknown }) => ({
        ...j,
        jobType: "pr_review" as const,
        unifiedId: `pr_review:${j.jobId}`
      }))
    ];
    const sorted = withUnified.sort(
      (a, b) =>
        new Date((b as unknown as { updatedAt: string }).updatedAt).getTime() -
        new Date((a as unknown as { updatedAt: string }).updatedAt).getTime()
    );
    const data = sorted.slice(offset, offset + limit);

    return {
      code: "OK",
      message: "success",
      data,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post(":jobId/resume-after-approval")
  async resumeAfterApproval(
    @Req() req: Request,
    @Param("jobId") unifiedId: string
  ) {
    const colon = unifiedId.indexOf(":");
    if (colon === -1) {
      throw new BadRequestException(
        "JOB_ID_FORMAT_INVALID: expected knowledge:<id> or pr_review:<id>"
      );
    }
    const jobType = unifiedId.slice(0, colon);
    const jobId = unifiedId.slice(colon + 1);
    if (jobType === "knowledge") {
      const data = await this.knowledgeService.resumeIndexJob(jobId);
      return {
        code: "OK",
        message: "success",
        data: { ...data, unifiedId: `knowledge:${data.jobId}` },
        traceId: req.requestContext?.traceId ?? "unknown"
      };
    }
    if (jobType === "pr_review") {
      const data = await this.integrationsService.resumePrReviewJob(jobId);
      return {
        code: "OK",
        message: "success",
        data: { ...data, unifiedId: `pr_review:${data.jobId}` },
        traceId: req.requestContext?.traceId ?? "unknown"
      };
    }
    throw new BadRequestException(
      "JOB_TYPE_INVALID: expected knowledge or pr_review"
    );
  }

  @Get("dead-letters")
  async listDeadLetters(@Req() req: Request, @Query() query: ListDeadLettersDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.jobsService.listDeadLetters({
        queue: query.queue,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("dead-letters/:taskKey/retry")
  async retryDeadLetter(
    @Req() req: Request,
    @Param("taskKey") taskKey: string
  ) {
    await this.jobsService.retryDeadLetter(taskKey);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("dead-letters/:taskKey/replay")
  async replayDeadLetter(
    @Req() req: Request,
    @Param("taskKey") taskKey: string
  ) {
    await this.jobsService.replayDeadLetter(taskKey);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("dead-letters/:taskKey/ignore")
  async ignoreDeadLetter(
    @Req() req: Request,
    @Param("taskKey") taskKey: string
  ) {
    await this.jobsService.ignoreDeadLetter(taskKey);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("dead-letters/:taskKey/terminate")
  async terminateDeadLetter(
    @Req() req: Request,
    @Param("taskKey") taskKey: string
  ) {
    await this.jobsService.terminateDeadLetter(taskKey);
    return {
      code: "OK",
      message: "success",
      data: null,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
