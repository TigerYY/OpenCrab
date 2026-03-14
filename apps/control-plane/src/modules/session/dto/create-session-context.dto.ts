import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateSessionContextDto {
  @IsString()
  userId!: string;

  @IsString()
  workspaceId!: string;

  @IsString()
  channelType!: string;

  @IsObject()
  @IsOptional()
  resourceContext?: Record<string, string>;
}
