import { IsArray, IsIn, IsString } from "class-validator";

class KnowledgeSourceDto {
  @IsString()
  @IsIn(["git", "docs"])
  type!: "git" | "docs";

  @IsString()
  ref!: string;
}

export class CreateIndexJobDto {
  @IsString()
  workspaceId!: string;

  @IsArray()
  sources!: KnowledgeSourceDto[];

  @IsString()
  @IsIn(["initial", "incremental"])
  mode!: "initial" | "incremental";
}
