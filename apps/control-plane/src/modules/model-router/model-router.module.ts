import { Module } from "@nestjs/common";

import { AuditModule } from "../audit/audit.module";
import { ModelRouterController } from "./model-router.controller";
import { ModelRouterRepository } from "./model-router.repository";
import { ModelRouterService } from "./model-router.service";

@Module({
  imports: [AuditModule],
  controllers: [ModelRouterController],
  providers: [ModelRouterService, ModelRouterRepository]
})
export class ModelRouterModule {}
