import { IsString } from "class-validator";

export class CreateApprovalDto {
  @IsString()
  approvalType!: string;

  @IsString()
  workspaceId!: string;

  @IsString()
  reason!: string;
}
