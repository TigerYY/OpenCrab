import { Injectable } from "@nestjs/common";

import { AuditRepository } from "./audit.repository";
import { CreateAuditEventDto } from "./dto/create-audit-event.dto";

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  private readonly events: Array<CreateAuditEventDto & { createdAt: string }> =
    [];

  async create(event: CreateAuditEventDto) {
    const next = { ...event, createdAt: new Date().toISOString() };
    if (this.auditRepository.isDbEnabled()) {
      await this.auditRepository.create(event, next.createdAt);
      return next;
    }

    this.events.push(next);
    return next;
  }

  async list(filters: {
    workspaceId?: string;
    userId?: string;
    eventType?: string;
    traceId?: string;
  }) {
    if (this.auditRepository.isDbEnabled()) {
      return this.auditRepository.list(filters);
    }

    return this.events.filter((item) => {
      if (filters.workspaceId && item.workspaceId !== filters.workspaceId) {
        return false;
      }
      if (filters.userId && item.userId !== filters.userId) {
        return false;
      }
      if (filters.eventType && item.eventType !== filters.eventType) {
        return false;
      }
      if (filters.traceId && item.traceId !== filters.traceId) {
        return false;
      }
      return true;
    });
  }

  async listRuntimeFallbackStats(input: {
    workspaceId?: string;
    days: number;
    topN: number;
  }) {
    if (this.auditRepository.isDbEnabled()) {
      return this.auditRepository.listRuntimeFallbackStats(input);
    }

    const map = new Map<string, number>();
    const start = Date.now() - input.days * 24 * 60 * 60 * 1000;
    for (const item of this.events) {
      if (item.eventType !== "model.invoke.runtime") continue;
      if (input.workspaceId && item.workspaceId !== input.workspaceId) continue;
      if (Date.parse(item.createdAt) < start) continue;
      const reason = item.runtimeMeta?.fallbackReason ?? "";
      if (!reason || reason === "none") continue;
      map.set(reason, (map.get(reason) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([fallbackReason, count]) => ({ fallbackReason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, input.topN);
  }

  async listRuntimeFallbackTrend(input: { workspaceId?: string; days: number }) {
    if (this.auditRepository.isDbEnabled()) {
      return this.auditRepository.listRuntimeFallbackTrend(input);
    }
    const start = Date.now() - input.days * 24 * 60 * 60 * 1000;
    const map = new Map<string, number>();
    for (const item of this.events) {
      if (item.eventType !== "model.invoke.runtime") continue;
      if (input.workspaceId && item.workspaceId !== input.workspaceId) continue;
      if (Date.parse(item.createdAt) < start) continue;
      const reason = item.runtimeMeta?.fallbackReason ?? "";
      if (!reason || reason === "none") continue;
      const date = item.createdAt.slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async listRuntimeFallbackAlerts(input: {
    workspaceId?: string;
    windowMinutes: number;
    threshold: number;
  }) {
    if (this.auditRepository.isDbEnabled()) {
      return this.auditRepository.listRuntimeFallbackAlerts(input);
    }

    const start = Date.now() - input.windowMinutes * 60 * 1000;
    const grouped = new Map<string, { count: number; latestAt: string }>();
    for (const item of this.events) {
      if (item.eventType !== "model.invoke.runtime") continue;
      if (input.workspaceId && item.workspaceId !== input.workspaceId) continue;
      if (Date.parse(item.createdAt) < start) continue;
      const reason = item.runtimeMeta?.fallbackReason ?? "";
      if (!reason || reason === "none") continue;
      const prev = grouped.get(reason);
      if (!prev) {
        grouped.set(reason, { count: 1, latestAt: item.createdAt });
      } else {
        grouped.set(reason, {
          count: prev.count + 1,
          latestAt:
            Date.parse(item.createdAt) > Date.parse(prev.latestAt)
              ? item.createdAt
              : prev.latestAt
        });
      }
    }

    return [...grouped.entries()]
      .filter(([, val]) => val.count >= input.threshold)
      .map(([fallbackReason, val]) => ({
        fallbackReason,
        count: val.count,
        latestAt: val.latestAt
      }))
      .sort((a, b) => b.count - a.count);
  }
}
