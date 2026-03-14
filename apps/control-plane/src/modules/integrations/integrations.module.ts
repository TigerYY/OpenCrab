import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { IntegrationsController } from "./integrations.controller";
import { PrReviewConfigRepository } from "./pr-review-config.repository";
import { PrReviewConfigService } from "./pr-review-config.service";
import { IntegrationsRepository } from "./integrations.repository";
import { IntegrationsService } from "./integrations.service";

@Module({
  imports: [JobsModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    IntegrationsRepository,
    PrReviewConfigService,
    PrReviewConfigRepository
  ]
})
export class IntegrationsModule {}
