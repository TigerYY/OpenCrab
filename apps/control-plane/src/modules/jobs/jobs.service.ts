import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { RedisService } from "../../shared/persistence/redis.service";

export type JobState =
  | "queued"
  | "running"
  | "retrying"
  | "completed"
  | "failed"
  | "terminated";

type QueueTask = {
  taskKey: string;
  queue: string;
  payload: Record<string, unknown>;
  attempt: number;
  maxRetries: number;
  process?: () => Promise<void>;
  onStateChange?: (state: JobState, meta?: { error?: string; attempt?: number }) => Promise<void>;
};

type DeadLetterRecord = {
  taskKey: string;
  queue: string;
  payload: Record<string, unknown>;
  attempts: number;
  error: string;
  failedAt: string;
};

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly redisService: RedisService) {}

  private readonly maxConcurrency = 2;
  private readonly memoryQueues = new Map<string, QueueTask[]>();
  private readonly cancelledTaskKeys = new Set<string>();
  private readonly deadLetters: DeadLetterRecord[] = [];
  private timer: NodeJS.Timeout | null = null;
  private activeCount = 0;

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.processLoop();
    }, 500);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async enqueue(
    queue: string,
    payload: Record<string, unknown>,
    handlers?: {
      taskKey?: string;
      maxRetries?: number;
      process?: () => Promise<void>;
      onStateChange?: (
        state: JobState,
        meta?: { error?: string; attempt?: number }
      ) => Promise<void>;
    }
  ) {
    const serialized = JSON.stringify(payload);
    await this.redisService.enqueue(queue, serialized);

    if (!this.memoryQueues.has(queue)) {
      this.memoryQueues.set(queue, []);
    }
    const task: QueueTask = {
      taskKey: handlers?.taskKey ?? `${queue}:${Date.now()}`,
      queue,
      payload,
      attempt: 0,
      maxRetries: handlers?.maxRetries ?? 2,
      process: handlers?.process,
      onStateChange: handlers?.onStateChange
    };
    this.memoryQueues.get(queue)!.push(task);
    await task.onStateChange?.("queued", { attempt: 0 });
  }

  async terminate(taskKey: string) {
    this.cancelledTaskKeys.add(taskKey);
    for (const [, queue] of this.memoryQueues) {
      const index = queue.findIndex((item) => item.taskKey === taskKey);
      if (index >= 0) {
        const [task] = queue.splice(index, 1);
        await task.onStateChange?.("terminated");
      }
    }
  }

  listDeadLetters(input?: {
    queue?: string;
    limit?: number;
    offset?: number;
  }) {
    const queue = input?.queue;
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;
    const filtered = queue
      ? this.deadLetters.filter((item) => item.queue === queue)
      : this.deadLetters;
    return filtered.slice(offset, offset + limit);
  }

  private async processLoop() {
    while (this.activeCount < this.maxConcurrency) {
      const task = this.dequeueNext();
      if (!task) return;
      this.activeCount += 1;
      void this.processTask(task).finally(() => {
        this.activeCount -= 1;
      });
    }
  }

  private dequeueNext() {
    for (const [, queue] of this.memoryQueues) {
      const task = queue.shift();
      if (task) return task;
    }
    return null;
  }

  private async processTask(task: QueueTask) {
    if (this.cancelledTaskKeys.has(task.taskKey)) {
      await task.onStateChange?.("terminated");
      this.cancelledTaskKeys.delete(task.taskKey);
      return;
    }

    await task.onStateChange?.("running", { attempt: task.attempt });
    try {
      if (task.process) {
        await task.process();
      }
      if (this.cancelledTaskKeys.has(task.taskKey)) {
        await task.onStateChange?.("terminated");
        this.cancelledTaskKeys.delete(task.taskKey);
        return;
      }
      await task.onStateChange?.("completed", { attempt: task.attempt });
    } catch (error) {
      const nextAttempt = task.attempt + 1;
      const errorMessage =
        error instanceof Error ? error.message : "unknown job error";

      if (nextAttempt <= task.maxRetries) {
        await task.onStateChange?.("retrying", {
          attempt: nextAttempt,
          error: errorMessage
        });
        task.attempt = nextAttempt;
        this.memoryQueues.get(task.queue)?.push(task);
        return;
      }

      this.deadLetters.unshift({
        taskKey: task.taskKey,
        queue: task.queue,
        payload: task.payload,
        attempts: nextAttempt,
        error: errorMessage,
        failedAt: new Date().toISOString()
      });
      await task.onStateChange?.("failed", {
        attempt: nextAttempt,
        error: errorMessage
      });
    }
  }
}
