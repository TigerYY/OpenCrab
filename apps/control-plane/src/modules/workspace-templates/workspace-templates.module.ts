import { forwardRef, Module } from "@nestjs/common";

import { ApprovalModule } from "../approval/approval.module";
import { IntegrationsModule } from "../integrations/integrations.module";
import { WorkspaceModule } from "../workspace/workspace.module";
import { WorkspaceTemplatesController } from "./workspace-templates.controller";
import { WorkspaceTemplatesRepository } from "./workspace-templates.repository";
import { WorkspaceTemplatesService } from "./workspace-templates.service";

@Module({
  imports: [
    forwardRef(() => WorkspaceModule),
    ApprovalModule,
    IntegrationsModule
  ],
  controllers: [WorkspaceTemplatesController],
  providers: [WorkspaceTemplatesService, WorkspaceTemplatesRepository],
  exports: [WorkspaceTemplatesService]
})
export class WorkspaceTemplatesModule {}
