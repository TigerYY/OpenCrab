import { Module } from "@nestjs/common";

import { JobsModule } from "../jobs/jobs.module";
import { KnowledgeController } from "./knowledge.controller";
import { KnowledgeRepository } from "./knowledge.repository";
import { KnowledgeService } from "./knowledge.service";

@Module({
  imports: [JobsModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService, KnowledgeRepository]
})
export class KnowledgeModule {}
