import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CallModule } from "./modules/call/call.module";
import { CalendarModule } from "./modules/calendar/calendar.module";
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [ CallModule, CalendarModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
