import { IsArray, IsIn, IsOptional, IsString } from "class-validator";

export class BatchDecisionDto {
  @IsArray()
  @IsString({ each: true })
  ticketIds!: string[];

  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsOptional()
  decidedBy?: string;
}
