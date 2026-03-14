import { Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { ListDeadLettersDto } from "./dto/list-dead-letters.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

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
