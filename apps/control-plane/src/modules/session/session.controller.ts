import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { CreateSessionContextDto } from "./dto/create-session-context.dto";
import { SessionService } from "./session.service";

@Controller("session")
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post("context")
  async createContext(@Req() req: Request, @Body() body: CreateSessionContextDto) {
    return {
      code: "OK",
      message: "success",
      data: await this.sessionService.createContext(body),
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
