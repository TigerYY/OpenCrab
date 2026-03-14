import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { JobsService, JobState } from "../jobs/jobs.service";
import { CreateIndexJobDto } from "./dto/create-index-job.dto";
import { KnowledgeRepository } from "./knowledge.repository";
import { RetrieveDto } from "./dto/retrieve.dto";

type IndexJob = {
  jobId: string;
  workspaceId: string;
  mode: string;
  status: string;
  sources: Array<{ type: string; ref: string }>;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
};

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly jobsService: JobsService
  ) {}

  private readonly inMemoryJobs: IndexJob[] = [];

  async createIndexJob(input: CreateIndexJobDto) {
    const now = new Date().toISOString();
    const job = {
      jobId: `idx_${Date.now()}`,
      workspaceId: input.workspaceId,
      mode: input.mode,
      status: "queued",
      sources: input.sources,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
      maxRetries: 2,
      lastError: undefined
    };
    await this.persistJob(job);
    await this.enqueueJob(job);
    return job;
  }

  async listIndexJobs(input: {
    workspaceId?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    if (this.knowledgeRepository.isDbEnabled()) {
      return this.knowledgeRepository.list(input);
    }
    const filtered = this.inMemoryJobs.filter((job) => {
      if (input.workspaceId && job.workspaceId !== input.workspaceId) return false;
      if (input.status && job.status !== input.status) return false;
      return true;
    });
    return filtered.slice(input.offset, input.offset + input.limit);
  }

  async getIndexJob(jobId: string) {
    if (this.knowledgeRepository.isDbEnabled()) {
      const job = await this.knowledgeRepository.getById(jobId);
      if (!job) throw new NotFoundException("INDEX_JOB_NOT_FOUND");
      return job;
    }
    const job = this.inMemoryJobs.find((item) => item.jobId === jobId);
    if (!job) throw new NotFoundException("INDEX_JOB_NOT_FOUND");
    return job;
  }

  async retryIndexJob(jobId: string) {
    const job = await this.getIndexJob(jobId);
    if (job.status === "running") {
      throw new BadRequestException("INDEX_JOB_RUNNING");
    }
    const retryJob: IndexJob = {
      ...job,
      status: "queued",
      lastError: undefined,
      updatedAt: new Date().toISOString()
    };
    await this.persistJob(retryJob);
    await this.enqueueJob(retryJob);
    return retryJob;
  }

  async terminateIndexJob(jobId: string) {
    const job = await this.getIndexJob(jobId);
    await this.jobsService.terminate(this.taskKey(jobId));
    const terminated: IndexJob = {
      ...job,
      status: "terminated",
      updatedAt: new Date().toISOString()
    };
    await this.persistJob(terminated);
    return terminated;
  }

  retrieve(input: RetrieveDto) {
    return {
      chunks: [
        {
          sourceType: "git",
          sourceRef: "repo-a/src/service/sms.ts",
          snippet: `Mock chunk for query: ${input.query}`,
          score: 0.91
        }
      ].slice(0, input.topK)
    };
  }

  private async enqueueJob(job: IndexJob) {
    await this.jobsService.enqueue("knowledge.index", job, {
      taskKey: this.taskKey(job.jobId),
      maxRetries: job.maxRetries,
      process: async () => {
        // placeholder execution for Phase 1; real index worker will replace this.
      },
      onStateChange: async (state, meta) => {
        await this.applyState(job.jobId, state, meta?.error, meta?.attempt);
      }
    });
  }

  private async applyState(
    jobId: string,
    state: JobState,
    error?: string,
    attempt?: number
  ) {
    const job = await this.getIndexJob(jobId);
    let nextStatus = state;
    if (state === "retrying") {
      nextStatus = "queued";
    }
    const next: IndexJob = {
      ...job,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      retryCount: attempt ?? job.retryCount,
      lastError: error ?? (nextStatus === "completed" ? undefined : job.lastError)
    };
    if (nextStatus === "completed") {
      next.lastError = undefined;
    }
    await this.persistJob(next);
  }

  private async persistJob(job: IndexJob) {
    if (this.knowledgeRepository.isDbEnabled()) {
      const existing = await this.knowledgeRepository.getById(job.jobId);
      if (!existing) {
        await this.knowledgeRepository.createIndexJob(job);
      } else {
        await this.knowledgeRepository.updateJob(job.jobId, {
          status: job.status,
          updatedAt: job.updatedAt,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          lastError: job.lastError
        });
      }
      return;
    }
    const idx = this.inMemoryJobs.findIndex((item) => item.jobId === job.jobId);
    if (idx >= 0) {
      this.inMemoryJobs[idx] = job;
    } else {
      this.inMemoryJobs.unshift(job);
    }
  }

  private taskKey(jobId: string) {
    return `knowledge.index:${jobId}`;
  }
}
