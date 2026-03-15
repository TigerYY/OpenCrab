import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { RedisClientType, createClient } from "redis";

const DEFAULT_REDIS_URL = "redis://localhost:6379";
const CONNECT_RETRIES = 3;
const CONNECT_RETRY_DELAY_MS = 2000;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private connected = false;

  async onModuleInit() {
    const url = process.env.REDIS_URL ?? DEFAULT_REDIS_URL;
    for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
      const c = createClient({ url });
      try {
        await c.connect();
        this.client = c as RedisClientType;
        this.connected = true;
        return;
      } catch {
        try {
          await c.quit();
        } catch {
          /* ignore */
        }
        if (attempt < CONNECT_RETRIES) {
          await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
        } else {
          this.connected = false;
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.client && this.connected) {
      await this.client.quit();
    }
  }

  isConnected() {
    return this.connected && this.client !== null;
  }

  async set(key: string, value: string, ttlSec?: number) {
    if (!this.client || !this.connected) return;
    if (ttlSec && ttlSec > 0) {
      await this.client.set(key, value, { EX: ttlSec });
      return;
    }
    await this.client.set(key, value);
  }

  async enqueue(queue: string, value: string) {
    if (!this.client || !this.connected) return;
    await this.client.lPush(queue, value);
  }
}
