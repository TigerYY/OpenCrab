import { Controller, Get, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { ListDeadLettersDto } from "./dto/list-dead-letters.dto";
import { JobsService } from "./jobs.service";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get("dead-letters")
  listDeadLetters(@Req() req: Request, @Query() query: ListDeadLettersDto) {
    return {
      code: "OK",
      message: "success",
      data: this.jobsService.listDeadLetters({
        queue: query.queue,
        limit: query.limit ?? 20,
        offset: query.offset ?? 0
      }),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
