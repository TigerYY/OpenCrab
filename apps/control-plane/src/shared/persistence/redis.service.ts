import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { RedisClientType, createClient } from "redis";

const DEFAULT_REDIS_URL = "redis://localhost:6379";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private connected = false;

  async onModuleInit() {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL ?? DEFAULT_REDIS_URL
      });
      await this.client.connect();
      this.connected = true;
    } catch {
      this.connected = false;
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
