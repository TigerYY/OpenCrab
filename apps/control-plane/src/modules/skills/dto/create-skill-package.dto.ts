import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateSkillPackageDto {
  @IsString()
  @IsIn(["official", "private", "third_party"])
  sourceType!: "official" | "private" | "third_party";

  @IsString()
  version!: string;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsString()
  @IsOptional()
  workspaceId?: string;
}
