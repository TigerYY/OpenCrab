import { forwardRef, Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeRepository } from "./knowledge.repository";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [forwardRef(() => JobsModule)],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository],
  exports: [KnowledgeService]
})
export class KnowledgeModule {}
