import { Module } from "@nestjs/common";

import { DeadLetterRepository } from "./dead-letter.repository";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";

@Module({
  controllers: [JobsController],
  providers: [JobsService, DeadLetterRepository],
  exports: [JobsService]
})
export class JobsModule {}
