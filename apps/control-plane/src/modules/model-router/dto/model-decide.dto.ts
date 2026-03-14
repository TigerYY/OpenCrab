import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ModelDecideDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  taskType!: string;

  @IsString()
  sensitivity!: string;

  @IsString()
  @IsOptional()
  preferredProvider?: string;

  @IsBoolean()
  fallbackAllowed!: boolean;
}
