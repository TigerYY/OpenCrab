import { Global, Module } from "@nestjs/common";

import { OpenclawAcpClientService } from "./openclaw-acp-client.service";
import { RuntimeAdapterService } from "./runtime-adapter.service";

@Global()
@Module({
  providers: [OpenclawAcpClientService, RuntimeAdapterService],
  exports: [RuntimeAdapterService]
})
export class RuntimeAdapterModule {}
