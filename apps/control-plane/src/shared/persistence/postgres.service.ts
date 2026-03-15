import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { Pool, QueryResultRow } from "pg";

const DEFAULT_PG_URL = "postgresql://opencrab:opencrab@localhost:5432/opencrab";
const CONNECT_RETRIES = 3;
const CONNECT_RETRY_DELAY_MS = 2000;

@Injectable()
export class PostgresService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool | null = null;
  private connected = false;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL ?? DEFAULT_PG_URL;
    this.pool = new Pool({ connectionString });
    for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
      try {
        await this.pool.query("SELECT 1");
        this.connected = true;
        await this.runMigrations();
        return;
      } catch {
        if (attempt < CONNECT_RETRIES) {
          await new Promise((r) => setTimeout(r, CONNECT_RETRY_DELAY_MS));
        } else {
          this.connected = false;
        }
      }
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  isConnected() {
    return this.connected && this.pool !== null;
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = []
  ) {
    if (!this.pool || !this.connected) {
      throw new Error("POSTGRES_UNAVAILABLE");
    }
    return this.pool.query<T>(sql, params);
  }

  private async runMigrations() {
    if (!this.pool) return;

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id BIGSERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = join(
      process.cwd(),
      "apps/control-plane/src/shared/persistence/migrations"
    );
    const files = (await readdir(migrationsDir))
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const alreadyApplied = await this.pool.query<{ filename: string }>(
        "SELECT filename FROM schema_migrations WHERE filename = $1 LIMIT 1",
        [file]
      );
      if (alreadyApplied.rowCount && alreadyApplied.rowCount > 0) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf8");
      await this.pool.query("BEGIN");
      try {
        await this.pool.query(sql);
        await this.pool.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [file]
        );
        await this.pool.query("COMMIT");
      } catch (error) {
        await this.pool.query("ROLLBACK");
        throw error;
      }
    }
  }
}
