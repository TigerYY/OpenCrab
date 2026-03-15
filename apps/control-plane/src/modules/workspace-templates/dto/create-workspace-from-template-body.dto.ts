import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateWorkspaceFromTemplateBodyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}
