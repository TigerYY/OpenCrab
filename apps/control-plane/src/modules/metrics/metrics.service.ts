import { Injectable } from "@nestjs/common";

import { MetricsRepository } from "./metrics.repository";

@Injectable()
export class MetricsService {
  constructor(private readonly repository: MetricsRepository) {}

  async getAdoption(workspaceId: string, from?: string, to?: string) {
    const [f, t] = this.defaultWindow(from, to);
    return this.repository.getAdoptionMetrics(workspaceId, f, t);
  }

  async getQuality(workspaceId: string, from?: string, to?: string) {
    const [f, t] = this.defaultWindow(from, to);
    return this.repository.getQualityMetrics(workspaceId, f, t);
  }

  async getGovernance(workspaceId: string, from?: string, to?: string) {
    const [f, t] = this.defaultWindow(from, to);
    return this.repository.getGovernanceMetrics(workspaceId, f, t);
  }

  async getPlatform(workspaceId: string, from?: string, to?: string) {
    const [f, t] = this.defaultWindow(from, to);
    return this.repository.getPlatformMetrics(workspaceId, f, t);
  }

  private defaultWindow(from?: string, to?: string): [string, string] {
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 7 * 24 * 3600 * 1000);
    return [start.toISOString(), end.toISOString()];
  }
}
