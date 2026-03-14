import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { CreateIndexJobDto } from "./dto/create-index-job.dto";
import { ListIndexJobsDto } from "./dto/list-index-jobs.dto";
import { RetrieveDto } from "./dto/retrieve.dto";
import { KnowledgeService } from "./knowledge.service";

@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post("index-jobs")
  async createIndexJob(@Req() req: Request, @Body() body: CreateIndexJobDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.createIndexJob(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("index-jobs")
  async listIndexJobs(@Req() req: Request, @Query() query: ListIndexJobsDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.listIndexJobs({
        workspaceId: query.workspaceId,
        status: query.status,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("index-jobs/:jobId")
  async getIndexJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.getIndexJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("index-jobs/:jobId/retry")
  async retryIndexJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.retryIndexJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("index-jobs/:jobId/terminate")
  async terminateIndexJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.terminateIndexJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("index-jobs/:jobId/resume")
  async resumeIndexJob(@Req() req: Request, @Param("jobId") jobId: string) {
    return {
      code: "OK",
      message: "success",
      data: await this.knowledgeService.resumeIndexJob(jobId),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Post("retrieve")
  retrieve(@Req() req: Request, @Body() body: RetrieveDto) {
    return {
      code: "OK",
      message: "success",
      data: this.knowledgeService.retrieve(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
