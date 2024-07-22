import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';

describe('Calendar', () => {
  let provider: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarService],
    }).compile();

    provider = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
