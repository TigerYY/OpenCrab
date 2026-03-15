import { forwardRef, Module } from "@nestjs/common";

import { WorkspaceModule } from "../workspace/workspace.module";
import { WorkspaceTemplatesController } from "./workspace-templates.controller";
import { WorkspaceTemplatesRepository } from "./workspace-templates.repository";
import { WorkspaceTemplatesService } from "./workspace-templates.service";

@Module({
  imports: [forwardRef(() => WorkspaceModule)],
  controllers: [WorkspaceTemplatesController],
  providers: [WorkspaceTemplatesService, WorkspaceTemplatesRepository],
  exports: [WorkspaceTemplatesService]
})
export class WorkspaceTemplatesModule {}
