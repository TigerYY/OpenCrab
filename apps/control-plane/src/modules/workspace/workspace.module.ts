import { Module } from "@nestjs/common";

import { WorkspaceRepository } from "./workspace.repository";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceService } from "./workspace.service";

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceRepository],
  exports: [WorkspaceService]
})
export class WorkspaceModule {}
