import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateWorkspaceTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  sourceWorkspaceId!: string;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}
