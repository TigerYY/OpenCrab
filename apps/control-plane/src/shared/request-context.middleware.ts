import {
  BadRequestException,
  Injectable,
  NestMiddleware
} from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

export type ChannelType = "ide" | "web" | "pr_webhook";

declare module "express-serve-static-core" {
  interface Request {
    requestContext?: {
      traceId: string;
      workspaceId: string;
      channelType: ChannelType;
    };
  }
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Allow health endpoint without business headers.
    if (req.originalUrl.includes("health")) {
      next();
      return;
    }

    const traceId = req.header("X-Trace-Id");
    const workspaceId = req.header("X-Workspace-Id");
    const channelType = req.header("X-Channel-Type") as ChannelType | undefined;

    if (!traceId || !workspaceId || !channelType) {
      throw new BadRequestException(
        "Missing required headers: X-Trace-Id, X-Workspace-Id, X-Channel-Type"
      );
    }

    if (!["ide", "web", "pr_webhook"].includes(channelType)) {
      throw new BadRequestException(
        "Invalid X-Channel-Type, expected ide|web|pr_webhook"
      );
    }

    req.requestContext = { traceId, workspaceId, channelType };
    next();
  }
}
