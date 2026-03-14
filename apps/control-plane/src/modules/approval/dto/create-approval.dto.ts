import { IsArray, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateApprovalDto {
  @IsString()
  approvalType!: string;

  @IsString()
  workspaceId!: string;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  approvers?: string[];

  @IsInt()
  @Min(1)
  @IsOptional()
  timeoutMinutes?: number;
}
