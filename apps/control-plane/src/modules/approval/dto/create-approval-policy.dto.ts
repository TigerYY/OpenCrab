import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateApprovalPolicyDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  triggerEvent!: string;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsString()
  approverRule!: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  timeoutMinutes?: number;
}
