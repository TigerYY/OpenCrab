import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateAuditEventDto {
  @IsString()
  eventType!: string;

  @IsString()
  workspaceId!: string;

  @IsString()
  userId!: string;

  @IsString()
  traceId!: string;

  @IsString()
  @IsOptional()
  policyDecision?: string;

  @IsString()
  @IsOptional()
  resourceRef?: string;

  @IsObject()
  @IsOptional()
  runtimeMeta?: {
    taskType?: string;
    model?: string;
    adapter?: string;
    fallbackReason?: string;
  };
}
