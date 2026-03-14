import { IsIn, IsOptional, IsString } from "class-validator";

export class ListApprovalQueryDto {
  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  @IsIn(["pending", "approved", "rejected", "timeout"])
  status?: "pending" | "approved" | "rejected" | "timeout";
}
