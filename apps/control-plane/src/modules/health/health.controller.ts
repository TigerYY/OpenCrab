import { Controller, Get } from "@nestjs/common";

import { PostgresService } from "../../shared/persistence/postgres.service";
import { RedisService } from "../../shared/persistence/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly postgresService: PostgresService,
    private readonly redisService: RedisService
  ) {}

  @Get()
  getHealth() {
    return {
      code: "OK",
      message: "success",
      data: {
        service: "opencarb-control-plane",
        status: "up",
        postgres: this.postgresService.isConnected() ? "connected" : "fallback",
        redis: this.redisService.isConnected() ? "connected" : "fallback"
      }
    };
  }
}
