import { Injectable } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";

@Injectable()
export class ModelRouterRepository {
  constructor(private readonly postgresService: PostgresService) {}

  isDbEnabled() {
    return this.postgresService.isConnected();
  }

  async logInvocation(record: {
    workspaceId: string;
    taskType: string;
    sensitivity: string;
    model: string;
    decision: string;
  }) {
    await this.postgresService.query(
      `INSERT INTO model_invocations (workspace_id, task_type, sensitivity, model, decision)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        record.workspaceId,
        record.taskType,
        record.sensitivity,
        record.model,
        record.decision
      ]
    );
  }
}
