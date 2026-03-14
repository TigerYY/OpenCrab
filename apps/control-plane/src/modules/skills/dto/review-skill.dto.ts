import { IsIn, IsOptional, IsString } from "class-validator";

export class ReviewSkillDto {
  @IsString()
  reviewer!: string;

  @IsString()
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";

  @IsString()
  @IsOptional()
  comment?: string;
}
