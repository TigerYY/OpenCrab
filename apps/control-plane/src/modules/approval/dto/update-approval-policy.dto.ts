import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateApprovalPolicyDto {
  @IsString()
  @IsOptional()
  approverRule?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  timeoutMinutes?: number;
}
