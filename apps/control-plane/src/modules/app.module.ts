import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import { RuntimeAdapterModule } from "../adapters/runtime-adapter/runtime-adapter.module";
import { RequestContextMiddleware } from "../shared/request-context.middleware";
import { PersistenceModule } from "../shared/persistence/persistence.module";
import { ApprovalModule } from "./approval/approval.module";
import { AuditModule } from "./audit/audit.module";
import { HealthModule } from "./health/health.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { JobsModule } from "./jobs/jobs.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { ModelRouterModule } from "./model-router/model-router.module";
import { SessionModule } from "./session/session.module";
import { WorkspaceModule } from "./workspace/workspace.module";

@Module({
  imports: [
    RuntimeAdapterModule,
    PersistenceModule,
    HealthModule,
    WorkspaceModule,
    SessionModule,
    ModelRouterModule,
    JobsModule,
    KnowledgeModule,
    AuditModule,
    ApprovalModule,
    IntegrationsModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
