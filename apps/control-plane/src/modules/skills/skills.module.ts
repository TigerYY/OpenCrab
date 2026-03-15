import { Module } from "@nestjs/common";

import { SkillsRegistryController } from "./skills-registry.controller";
import { SkillsRegistryRepository } from "./skills-registry.repository";
import { SkillsRegistryService } from "./skills-registry.service";
import { SkillsController } from "./skills.controller";
import { SkillsRepository } from "./skills.repository";
import { SkillsService } from "./skills.service";

@Module({
  controllers: [SkillsController, SkillsRegistryController],
  providers: [
    SkillsService,
    SkillsRepository,
    SkillsRegistryService,
    SkillsRegistryRepository
  ]
})
export class SkillsModule {}
