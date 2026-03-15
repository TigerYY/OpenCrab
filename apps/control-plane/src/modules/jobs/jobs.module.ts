import { forwardRef, Module } from "@nestjs/common";

import { DeadLetterRepository } from "./dead-letter.repository";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [
    forwardRef(() => KnowledgeModule),
    forwardRef(() => IntegrationsModule)
  ],
  controllers: [JobsController],
  providers: [JobsService, DeadLetterRepository],
  exports: [JobsService]
})
export class JobsModule {}
