import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly TOKEN: string;
  private readonly sender = { name: 'Mailtrap Test', email: 'webnai@gmail.com' };
  private readonly recipientEmail = 'wilbertboadzo144@gmail.com';

  constructor() {
    this.TOKEN = process.env.MAILTRAP_TOKEN; // Use environment variable
    if (!this.TOKEN) {
      throw new Error('Mailtrap token is not defined in environment variables.');
    }
  }

  async sendEmail(name: string, email: string, company: string): Promise<void> {
    const url = 'https://send.api.mailtrap.io/api/send';

    const payload = {
      from: this.sender,
      to: [{ email: this.recipientEmail }],
      subject: 'SOMEONE WANTS TO SPONSOR TASTE OF ACCRA',
      text: `Full Name: ${name}\nEmail Address: ${email}\nCompany Name: ${company}`,
    };

    try {
      const result = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(result.data);
    } catch (error) {
      console.error('Error sending email:', error.response?.data || error.message || error);
      throw new Error('Failed to send email');
    }
  }
}
