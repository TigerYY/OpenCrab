import { IsNumber, IsString, Max, Min } from "class-validator";

export class RetrieveDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  query!: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  topK!: number;
}
