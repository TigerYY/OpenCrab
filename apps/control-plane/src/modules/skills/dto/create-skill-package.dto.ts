import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateSkillPackageDto {
  @IsString()
  @IsIn(["official", "private", "third_party", "registry"])
  sourceType!: "official" | "private" | "third_party" | "registry";

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  sourceRef?: string;

  @IsString()
  @IsOptional()
  riskLevel?: string;

  @IsString()
  @IsOptional()
  workspaceId?: string;
}
