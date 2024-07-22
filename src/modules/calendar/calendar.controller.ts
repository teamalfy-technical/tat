import { Body, Controller, Get, Post } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { CalendarDto } from "./calendar.dto";

const { findAvailableSlots, bookAppointment } = new CalendarService();

@Controller("api/v1/calendar")
export class CalendarController {
  @Get("get-available-slots")
  async getAvialableSlots() {
    try {
      const availableSlots = await findAvailableSlots();

      return { slots: availableSlots };
    } catch (error) {
      throw error;
    }
  }

  @Post("book-appointment")
  async scheduleAppointment(@Body() appointmentDetails: CalendarDto) {
    try {
      const appointment = await bookAppointment(appointmentDetails);

      return { message: "Appointment scheduled successfully" };
    } catch (error) {
      throw error;
    }
  }
}
