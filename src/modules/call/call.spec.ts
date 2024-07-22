import { Test, TestingModule } from "@nestjs/testing";
import { CallService } from "./call.service";

describe("CallService", () => {
  let provider: CallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CallService],
    }).compile();

    provider = module.get<CallService>(CallService);
  });

  it("should be defined", () => {
    expect(provider).toBeDefined();
  });
});
