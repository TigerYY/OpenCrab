import { forwardRef, Module } from "@nestjs/common";

import { WorkspaceTemplatesModule } from "../workspace-templates/workspace-templates.module";
import { WorkspaceRepository } from "./workspace.repository";
import { WorkspaceController } from "./workspace.controller";
import { WorkspaceService } from "./workspace.service";

@Module({
  imports: [forwardRef(() => WorkspaceTemplatesModule)],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceRepository],
  exports: [WorkspaceService]
})
export class WorkspaceModule {}
