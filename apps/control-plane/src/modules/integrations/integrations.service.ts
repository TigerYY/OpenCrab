import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";

import { JobsService, JobState } from "../jobs/jobs.service";
import { PrWebhookDto } from "./dto/pr-webhook.dto";
import { IntegrationsRepository } from "./integrations.repository";

type PrReviewJob = {
  jobId: string;
  workspaceId: string;
  status: string;
  repo: string;
  prNumber: number;
  diffRef: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
};

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly integrationsRepository: IntegrationsRepository,
    private readonly jobsService: JobsService
  ) {}

  private readonly inMemoryPrJobs: PrReviewJob[] = [];

  async enqueuePrReview(input: PrWebhookDto) {
    const now = new Date().toISOString();
    const job = {
      jobId: `job_pr_${Date.now()}`,
      workspaceId: input.workspaceId,
      status: "queued",
      repo: input.repo,
      prNumber: input.prNumber,
      diffRef: input.diffRef,
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

  async listPrReviewJobs(input: {
    workspaceId?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    if (this.integrationsRepository.isDbEnabled()) {
      return this.integrationsRepository.list(input);
    }
    const filtered = this.inMemoryPrJobs.filter((job) => {
      if (input.workspaceId && job.workspaceId !== input.workspaceId) return false;
      if (input.status && job.status !== input.status) return false;
      return true;
    });
    return filtered.slice(input.offset, input.offset + input.limit);
  }

  async getPrReviewJob(jobId: string) {
    if (this.integrationsRepository.isDbEnabled()) {
      const job = await this.integrationsRepository.getById(jobId);
      if (!job) throw new NotFoundException("PR_REVIEW_JOB_NOT_FOUND");
      return job;
    }
    const job = this.inMemoryPrJobs.find((item) => item.jobId === jobId);
    if (!job) throw new NotFoundException("PR_REVIEW_JOB_NOT_FOUND");
    return job;
  }

  async retryPrReviewJob(jobId: string) {
    const job = await this.getPrReviewJob(jobId);
    if (job.status === "running") {
      throw new BadRequestException("PR_REVIEW_JOB_RUNNING");
    }
    const retryJob: PrReviewJob = {
      ...job,
      status: "queued",
      lastError: undefined,
      updatedAt: new Date().toISOString()
    };
    await this.persistJob(retryJob);
    await this.enqueueJob(retryJob);
    return retryJob;
  }

  async terminatePrReviewJob(jobId: string) {
    const job = await this.getPrReviewJob(jobId);
    await this.jobsService.terminate(this.taskKey(jobId));
    const terminated: PrReviewJob = {
      ...job,
      status: "terminated",
      updatedAt: new Date().toISOString()
    };
    await this.persistJob(terminated);
    return terminated;
  }

  private async enqueueJob(job: PrReviewJob) {
    await this.jobsService.enqueue("pr.review", job, {
      taskKey: this.taskKey(job.jobId),
      maxRetries: job.maxRetries,
      process: async () => {
        // placeholder execution for Phase 1; real PR review worker will replace this.
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
    const job = await this.getPrReviewJob(jobId);
    let nextStatus = state;
    if (state === "retrying") {
      nextStatus = "queued";
    }
    const next: PrReviewJob = {
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

  private async persistJob(job: PrReviewJob) {
    if (this.integrationsRepository.isDbEnabled()) {
      const existing = await this.integrationsRepository.getById(job.jobId);
      if (!existing) {
        await this.integrationsRepository.createPrReviewJob(job);
      } else {
        await this.integrationsRepository.updateJob(job.jobId, {
          status: job.status,
          updatedAt: job.updatedAt,
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
          lastError: job.lastError
        });
      }
      return;
    }
    const idx = this.inMemoryPrJobs.findIndex((item) => item.jobId === job.jobId);
    if (idx >= 0) {
      this.inMemoryPrJobs[idx] = job;
    } else {
      this.inMemoryPrJobs.unshift(job);
    }
  }

  private taskKey(jobId: string) {
    return `pr.review:${jobId}`;
  }
}
