import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { RedisService } from "../../shared/persistence/redis.service";
import { DeadLetterRepository } from "./dead-letter.repository";

export type JobState =
  | "queued"
  | "running"
  | "waiting_approval"
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
  constructor(
    private readonly redisService: RedisService,
    private readonly deadLetterRepository: DeadLetterRepository
  ) {}

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
      maxRetries: handlers?.maxRetries ?? 3,
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

  async listDeadLetters(input?: {
    queue?: string;
    limit?: number;
    offset?: number;
  }) {
    const queue = input?.queue;
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;
    const fromMemory = queue
      ? this.deadLetters.filter((item) => item.queue === queue)
      : this.deadLetters;
    const memorySlice = fromMemory.slice(offset, offset + limit);
    if (this.deadLetterRepository.isDbEnabled()) {
      const fromDb = await this.deadLetterRepository.list({
        queue,
        limit,
        offset: 0,
        resolved: false
      });
      const memoryKeys = new Set(memorySlice.map((d) => d.taskKey));
      const fromDbFiltered = fromDb.filter((d) => !memoryKeys.has(d.taskKey));
      return [...memorySlice, ...fromDbFiltered].slice(0, limit);
    }
    return memorySlice;
  }

  private getDeadLetter(taskKey: string): DeadLetterRecord | null {
    const found = this.deadLetters.find((d) => d.taskKey === taskKey);
    return found ?? null;
  }

  async retryDeadLetter(taskKey: string): Promise<void> {
    const fromMemory = this.getDeadLetter(taskKey);
    if (fromMemory) {
      this.deadLetters.splice(this.deadLetters.indexOf(fromMemory), 1);
      await this.redisService.enqueue(
        fromMemory.queue,
        JSON.stringify(fromMemory.payload)
      );
      if (!this.memoryQueues.has(fromMemory.queue)) {
        this.memoryQueues.set(fromMemory.queue, []);
      }
      this.memoryQueues.get(fromMemory.queue)!.push({
        taskKey: fromMemory.taskKey,
        queue: fromMemory.queue,
        payload: fromMemory.payload,
        attempt: 0,
        maxRetries: 3
      });
    }
    if (this.deadLetterRepository.isDbEnabled()) {
      const fromDb = await this.deadLetterRepository.getByTaskKey(taskKey);
      if (fromDb) {
        await this.redisService.enqueue(
          fromDb.queue,
          JSON.stringify(fromDb.payload)
        );
        await this.deadLetterRepository.markResolved(taskKey, "retry");
      } else if (!fromMemory) {
        throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
      }
    } else if (!fromMemory) {
      throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
    }
  }

  async replayDeadLetter(taskKey: string): Promise<void> {
    return this.retryDeadLetter(taskKey);
  }

  async ignoreDeadLetter(taskKey: string): Promise<void> {
    const fromMemory = this.getDeadLetter(taskKey);
    if (fromMemory) {
      this.deadLetters.splice(this.deadLetters.indexOf(fromMemory), 1);
    }
    if (this.deadLetterRepository.isDbEnabled()) {
      const fromDb = await this.deadLetterRepository.getByTaskKey(taskKey);
      if (fromDb) {
        await this.deadLetterRepository.markResolved(taskKey, "ignore");
      } else if (!fromMemory) {
        throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
      }
    } else if (!fromMemory) {
      throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
    }
  }

  async terminateDeadLetter(taskKey: string): Promise<void> {
    const fromMemory = this.getDeadLetter(taskKey);
    if (fromMemory) {
      this.deadLetters.splice(this.deadLetters.indexOf(fromMemory), 1);
    }
    if (this.deadLetterRepository.isDbEnabled()) {
      const fromDb = await this.deadLetterRepository.getByTaskKey(taskKey);
      if (fromDb) {
        await this.deadLetterRepository.markResolved(taskKey, "terminate");
      } else if (!fromMemory) {
        throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
      }
    } else if (!fromMemory) {
      throw new NotFoundException("DEAD_LETTER_NOT_FOUND");
    }
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

      const dlRecord: DeadLetterRecord = {
        taskKey: task.taskKey,
        queue: task.queue,
        payload: task.payload,
        attempts: nextAttempt,
        error: errorMessage,
        failedAt: new Date().toISOString()
      };
      this.deadLetters.unshift(dlRecord);
      if (this.deadLetterRepository.isDbEnabled()) {
        await this.deadLetterRepository.insert(dlRecord);
      }
      await task.onStateChange?.("failed", {
        attempt: nextAttempt,
        error: errorMessage
      });
    }
  }
}
