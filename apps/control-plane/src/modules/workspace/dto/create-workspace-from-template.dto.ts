import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateWorkspaceFromTemplateDto {
  @IsString()
  templateId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}
