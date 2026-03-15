import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ApprovalPolicyExportItem {
  @IsString()
  triggerEvent!: string;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsString()
  approverRule!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  timeoutMinutes?: number;
}

export class ImportApprovalPoliciesDto {
  @IsString()
  workspaceId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalPolicyExportItem)
  policies!: ApprovalPolicyExportItem[];
}
