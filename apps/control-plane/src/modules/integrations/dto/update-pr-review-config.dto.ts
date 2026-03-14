import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdatePrReviewConfigDto {
  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  rulesetId?: string;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsOptional()
  @IsIn(["comment", "summary", "status_check"])
  writebackPolicy?: string;
}
