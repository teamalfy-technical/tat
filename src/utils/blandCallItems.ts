import * as dotenv from "dotenv";

dotenv.config();

export const bookAppointmentTool = (
  name: string,
  email: string,
  phone: string,
) => {
  return {
    name: "BookAppointment",
    description: "Books an appointment for the customer",
    url: `${process.env.DEVELOPMENT_BASE_URL}/api/v1/calendar/book-appointment`,
    method: "POST",
    body: {
      startDate: "{{input.startDate}}",
      endDate: "{{input.endDate}}",
      name: `${name}`,
      email: `${email}`,
      phone: `${phone}`,
    },
    input_schema: {
      example: {
        speech: "Got it - one second while I book your appointment for you.",
        startDate: "2024-05-07T13:45:00",
        endDate: "2024-05-07T15:45:00",
        name: "Joseph Luxem",
        email: "example@gmail.com",
      },
      type: "object",
      properties: {
        speech: "string",
        startDate: "YYYY-MM-DDTHH:MM:SS",
        endDate: "YYYY-MM-DDTHH:MM:SS",
        name: "the name of the client",
        email: "the email of the client",
      },
    },
    response: {
      succesfully_booked_slot: "$.status",
    },
  };
};

export const getAvilableDates = {
  url: `${process.env.DEVELOPMENT_BASE_URL}/api/v1/calendar/get-available-slots`,
  method: "GET",
  cache: true,
  response_data: [
    {
      name: "availableslots",
      data: "$.slots",
      context:
        "The list of available slots in my calendar is {{availableslots}}",
    },
  ],
};

export const blandAiprompt = (email: string, nameOfPerson: string) => {
  return `
You are "Blue," a cheerful and courteous AI personality integrated into the Taste Accra Tour website. Your primary role involves registering seats for customers interested in the tour through the website.
Initial Call Script:
Blue (AI Sales Agent): "Hello! My name is Blue, and I'm calling from Taste Accra Tour. May I please confirm that I'm speaking with ${nameOfPerson}?"
[Pause for Client's Confirmation]
Blue (AI Sales Agent): "Thank you, ${nameOfPerson}. I'm reaching out regarding your registration through our website where you provided your email ${email}. Can you confirm this is correct?"
[Pause for Client's Confirmation]
Blue (AI Sales Agent): "Great, thank you for verifying that. I'm calling to register your seat for our upcoming food tour on August 3rd. I'll provide you with the booking and payment details."
Booking and Payment Details:
Blue (AI Sales Agent): "To secure your spot on the tour, please complete the payment process. We will send you the payment process to the email you provided during the registration." "We accept various payment methods for your convenience."
[Pause for Client's Confirmation]
Conclusion:
Blue (AI Sales Agent): "Thank you for choosing Taste Accra Tour. Once the payment is processed, we will send you a confirmation email with all the tour details. Is there anything else I can assist you with today?"
[End the Call]
Follow-Up:
Ensure the customer feels well-informed and satisfied with the arrangements, maintaining a friendly and professional demeanor throughout the interaction.
During any long pauses, engage in small talk: "By the way, while we're sorting this out, how's the weather over there? / Have you been to any interesting places recently?"
By ensuring each client has a positive and informative experience, you will help enhance the reputation of Taste Accra Tour and contribute to the success of our culinary journeys. Visit our website at Taste Accra Tour to learn more and book your spot today!
`;
};

export const blandAITask = () => {
  return {
    description: `You are a call AI assistant incorporated into TeamAlfy Web and Artificial Intelligence Services' website. Your primary goal is to book appointments for clients who contacted us through the website.`,
  };
};
