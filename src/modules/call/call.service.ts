import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import {
  blandAiprompt,
  bookAppointmentTool,
  getAvilableDates,
} from "../../utils/blandCallItems";

interface PromptDetails {
  name: string;
  phone_number: string;
  email: string;
}

interface StartCallBody {
  phone_number: string;
  task: string;
  record: boolean;
  voice: string;
  interruption_threshold: number;
  tools: [{}];
  dynamic_data: [{}];
}

const blandHeaders = {
  headers: { Authorization: process.env.BLANDAI_API },
};

interface UserText {
  user: string;
  text: string;
}

function extractUserText(data: any): UserText[] {
  return data.map((transcript: { user: string, text: string }) => ({
    user: transcript.user,
    text: transcript.text,
  }));
}

@Injectable()
export class CallService {
  async startCall(promptDetails: PromptDetails): Promise<any> {
    try {
      const body = {
        task: blandAiprompt(promptDetails.email, promptDetails.name),
        phone_number: promptDetails.phone_number,
        record: true,
        voice: 'maya',
        interruption_threshold: 50,
        tools: [
          bookAppointmentTool(
            promptDetails.name,
            promptDetails.email,
            promptDetails.phone_number,
          ),
        ],
        dynamic_data: [getAvilableDates],
      };
      console.log(JSON.stringify(body, null, 2));

      const response = await axios.post('https://api.bland.ai/v1/calls', body, blandHeaders);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new HttpException(error.response.data, error.response.status);
      } else {
        throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async processCallDetailsInBackground(
    call_id: string,
    user_email: string,
    phone_number: string,
  ) {
    // Run the saveCallDetails function in the background
    this.saveCallDetails(call_id, user_email, phone_number);
  }

  async saveCallDetails(
    call_id: string,
    user_email: string,
    phone_number: string,
  ) {
    try {
      const pollingInterval = 10000; // Poll every 10 seconds
      const maxAttempts = 120;
      let attempts = 0;
      while (attempts < maxAttempts) {
        const checkCallCompletion = await axios.get(
          `https://api.bland.ai/v1/calls/${call_id}`,
          { ...blandHeaders },
        );

        if (checkCallCompletion.data.completed) {
          const cd = checkCallCompletion.data;
          const details = {
            call_id,
            duration: cd.call_length,
            recording_url: cd.recording_url,
            started_at: cd.started_at,
            status: "completed",
            summary: cd.summary,
            user_email,
            transcripts: JSON.stringify(extractUserText(cd.transcripts)),
            phone_number,
            price: JSON.stringify(cd.price),
          };

          return details;
        }
        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        attempts++;
      }
    } catch (error) {
      console.error(
        "Error saving call details:",
        error.response?.data || error.message,
      );
      // Throw a custom HttpException with appropriate status code
      throw new HttpException(
        "Failed to save call details",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCallDetails(param: string) {
    try {
      const callDetails = await axios.get(
        `https://api.bland.ai/v1/calls?param=${param}`,
        { ...blandHeaders },
      );

      return callDetails.data;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw new Error('Unable to fetch call details. Please try again later.');
    }
  }

  async getDetailsForPastMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      const callDetails = await axios.get(
        `https://api.bland.ai/v1/calls?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
        { ...blandHeaders },
      );

      return callDetails.data;
    } catch (error) {
      console.error('Error fetching call details for the past month:', error);
      throw new Error('Unable to fetch call details for the past month. Please try again later.');
    }
  }

  async getTotalCostForPastMonth(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      const callDetails = await axios.get(
        `https://api.bland.ai/v1/calls?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`,
        { ...blandHeaders },
      );

      // Calculate total cost
      const totalCost = callDetails.data.reduce((sum, detail) => {
        return sum + (parseFloat(detail.price) || 0); // Convert price to float and add to sum
      }, 0);

      return totalCost;
    } catch (error) {
      console.error('Error calculating total cost for the past month:', error);
      throw new Error('Unable to calculate total cost for the past month. Please try again later.');
    }
  }
}
