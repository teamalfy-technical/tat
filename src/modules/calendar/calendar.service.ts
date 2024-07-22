import { Injectable } from "@nestjs/common";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as path from "path";
import axios from "axios";

// Load environment variables
dotenv.config();

const authorizeCalendar = async () => {
  const credentialsPath = path.join(
    __dirname,
    "../../../calendar_details.json",
  );

  // Check if the file exists
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found at path: ${credentialsPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Missing client_email or private_key in credentials");
  }

  // Set up JWT client with the service account credentials
  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key, // Use "key" instead of "keyFile"
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  await client.authorize(); // Explicitly authorize the client

  return google.calendar({ version: "v3", auth: client });
};

interface MeetingDetails {
  name: string;
  email: string;
  startDate: string;
  endDate: string;
  phone: string;
}

interface WorkingHours {
  start: Date;
  end: Date;
}

function getNextWorkingDays(numDays: number): WorkingHours[] {
  const workingHoursStart = 9; // 9 AM
  const workingHoursEnd = 17; // 5 PM
  const workingDays = [1, 2, 3, 4, 5]; // Monday to Friday

  let currentDate = new Date();
  const nextWorkingDays: WorkingHours[] = [];

  while (nextWorkingDays.length < numDays) {
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day

    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)

    if (workingDays.includes(dayOfWeek) && !isWeekend) {
      const start = new Date(currentDate);
      start.setHours(workingHoursStart, 0, 0, 0);

      const end = new Date(currentDate);
      end.setHours(workingHoursEnd, 0, 0, 0);

      nextWorkingDays.push({ start, end });
    }
  }

  return nextWorkingDays;
}

const findBookedSlots = async () => {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days in milliseconds

  try {
    const calendar = await authorizeCalendar();

    const events = await calendar.events.list({
      calendarId: process.env.TCALENDAR_ID || "",
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
      singleEvents: true, // Only check for single events
      orderBy: "startTime", // Order results chronologically
    });

    const filterBookedSlots = (): any[] => {
      const filteredEvents: any[] = [];

      for (let i = 0; i < getNextWorkingDays(5).length; i++) {
        const dayEvents = events.data.items?.filter((event) => {
          const startDateTime = event.start && event.start.dateTime;
          const startDate = event.start && event.start.date;
          const workingHoursStart = getNextWorkingDays(5)[i].start;
          const workingHoursEnd = getNextWorkingDays(5)[i].end;

          function extractDateParts(dateString: string): string {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Zero-padding for single-digit months
            const day = date.getDate().toString().padStart(2, "0"); // Zero-padding for single-digit days
            return `${year}-${month}-${day}`;
          }

          if (startDateTime) {
            return (
              extractDateParts(startDateTime) ===
                extractDateParts(workingHoursStart.toISOString()) &&
              new Date(startDateTime).getTime() >=
                workingHoursStart.getTime() &&
              new Date(startDateTime).getTime() < workingHoursEnd.getTime()
            );
          } else if (startDate) {
            const extractedStartDate = extractDateParts(startDate);
            return (
              extractedStartDate ===
              extractDateParts(workingHoursStart.toISOString())
            );
          }

          return false; // Exclude events that don't match either startDateTime or startDate
        });

        if (dayEvents) {
          filteredEvents.push(...dayEvents);
        }
      }

      return filteredEvents;
    };

    const getDatesOnly = () => {
      return filterBookedSlots().map((item) => {
        const startDateTime = item.start && item.start.dateTime;
        const startDate = item.start && item.start.date;

        if (startDateTime) {
          return startDateTime;
        } else if (startDate) {
          return startDate;
        }

        return null; // Handle cases where neither startDateTime nor startDate is available
      });
    };

    return getDatesOnly();
  } catch (error) {
    throw error;
    // return []; // Return empty array on error
  }
};

@Injectable()
export class CalendarService {
  async findAvailableSlots() {
    try {
      const bookedSlots = await findBookedSlots();

      // Function to deduce available slots for the next 5 working days

      function getAvailableSlots(
        bookedSlots: string[],
        workStartTime: string = "09:00",
        workEndTime: string = "17:00",
      ): string[] {
        const availableSlots: string[] = [];
        const today = new Date();

        // Reset hours, minutes, seconds, and milliseconds for today
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 5; i++) {
          const targetDate = new Date(today.getTime()); // Use a copy of today's date

          // Move targetDate to next valid workday
          targetDate.setDate(targetDate.getDate() + i);
          while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
            targetDate.setDate(targetDate.getDate() + 1);
          }

          const formattedDate = targetDate.toISOString().slice(0, 10);

          for (
            let hour = parseInt(workStartTime.split(":")[0]);
            hour <= parseInt(workEndTime.split(":")[0]);
            hour++
          ) {
            const slotStart = `${formattedDate}T${hour
              .toString()
              .padStart(2, "0")}:00:00+02:00`;
            const slotEnd = `${formattedDate}T${(hour + 1)
              .toString()
              .padStart(2, "0")}:00:00+02:00`;

            // Check for overlap with booked slots
            const slotBooked = bookedSlots.some((bookedSlot) => {
              const bookedStart = new Date(bookedSlot);
              const bookedEnd = new Date(
                bookedStart.getTime() + 60 * 60 * 1000,
              );
              return (
                bookedStart <= new Date(slotEnd) &&
                bookedEnd > new Date(slotStart)
              );
            });

            if (!slotBooked) {
              availableSlots.push(slotStart);
            }
          }
        }

        console.log(availableSlots);
        return availableSlots;
      }

      // Example usage

      const availableSlots = getAvailableSlots(bookedSlots);
      return JSON.stringify(availableSlots);
      // Output available slots
    } catch (error) {
      throw error;
    }
  }

  async bookAppointment(data: MeetingDetails) {
    const headers = {
      Authorization: `Token ${process.env.MAKE_API}`,
    };

    try {
      const runScenario = await axios.post(
        `https://hook.eu2.make.com/cacpsnayo3j73jfg552e99f3p3xc1x0b`,
        {
          name: data.name,
          email: data.email,
          startDate: data.startDate,
          endDate: data.endDate,
          phone: data.phone,
        },
        { headers },
      );
      console.log(runScenario.data);
      return runScenario.data;
    } catch (error) {
      throw error;
    }
  }
}
