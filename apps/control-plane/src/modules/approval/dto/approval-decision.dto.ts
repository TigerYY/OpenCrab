import { IsIn, IsOptional, IsString } from "class-validator";

export class ApprovalDecisionDto {
  @IsString()
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";

  @IsString()
  @IsOptional()
  comment?: string;
}
