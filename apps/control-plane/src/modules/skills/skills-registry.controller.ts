import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { SkillsRegistryService } from "./skills-registry.service";

@Controller("skills/registry")
export class SkillsRegistryController {
  constructor(private readonly registryService: SkillsRegistryService) {}

  @Get("packages")
  async listPackages(
    @Req() req: Request,
    @Query("status") status?: string
  ) {
    const hasPublished =
      status === "published" ? true : status === "draft" ? false : undefined;
    const data = await this.registryService.listPackages(hasPublished);
    return {
      code: "OK",
      message: "success",
      data,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }

  @Get("packages/:packageId/versions")
  async listVersions(
    @Req() req: Request,
    @Param("packageId") packageId: string
  ) {
    const data = await this.registryService.listVersions(packageId);
    return {
      code: "OK",
      message: "success",
      data,
      traceId: req.requestContext?.traceId ?? "unknown"
    };
  }
}
