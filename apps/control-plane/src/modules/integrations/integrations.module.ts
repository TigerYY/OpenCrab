import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { IntegrationsController } from "./integrations.controller";
import { IntegrationsRepository } from "./integrations.repository";
import { IntegrationsService } from "./integrations.service";

@Module({
  imports: [JobsModule],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IntegrationsRepository]
})
export class IntegrationsModule {}
