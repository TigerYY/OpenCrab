import { Module } from "@nestjs/common";

import { ApprovalController } from "./approval.controller";
import { ApprovalPolicyController } from "./approval-policy.controller";
import { ApprovalPolicyRepository } from "./approval-policy.repository";
import { ApprovalPolicyService } from "./approval-policy.service";
import { ApprovalRepository } from "./approval.repository";
import { ApprovalService } from "./approval.service";

@Module({
  controllers: [ApprovalController, ApprovalPolicyController],
  providers: [
    ApprovalService,
    ApprovalRepository,
    ApprovalPolicyService,
    ApprovalPolicyRepository
  ]
})
export class ApprovalModule {}
