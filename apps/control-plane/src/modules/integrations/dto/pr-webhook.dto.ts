import { IsNumber, IsString } from "class-validator";

export class PrWebhookDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  repo!: string;

  @IsNumber()
  prNumber!: number;

  @IsString()
  diffRef!: string;
}
