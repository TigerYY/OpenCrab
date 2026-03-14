import { IsString } from "class-validator";

export class ModelInvokeDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  taskType!: string;

  @IsString()
  prompt!: string;

  @IsString()
  sensitivity!: string;
}
