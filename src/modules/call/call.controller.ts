import { Body, Controller, Post, HttpException, HttpStatus, Get, Param } from '@nestjs/common';
import { CallDto } from './call.dto';
import { CallService } from './call.service';

interface MakeCallReqBody {
  trimedName: boolean;
  trimedEmail: boolean;
  trimedPhone: boolean;
}

@Controller('api/v1/call')
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Post('send-call')
  async makeCall(@Body() reqBody: CallDto) {
    const { name, email, phone_number } = reqBody;

    if (!name || !email || !phone_number)
      throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);

    const reqBodyTrimed: MakeCallReqBody = {
      trimedName: name.trim() === '',
      trimedEmail: email.trim() === '',
      trimedPhone: phone_number.trim() === '',
    };

    if (phone_number.trim().length !== 13)
      throw new HttpException('Invalid phone number', HttpStatus.BAD_REQUEST);

    if (reqBodyTrimed.trimedEmail || reqBodyTrimed.trimedName || reqBodyTrimed.trimedPhone)
      throw new HttpException('Field cannot be blank', HttpStatus.BAD_REQUEST);

    try {
      const promptDetails = { name, phone_number, email };
      const callResponse = await this.callService.startCall(promptDetails);

      this.callService.processCallDetailsInBackground(callResponse.call_id, email, phone_number);

      return { data: callResponse };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  @Get('monthly-bill')
  async getCallsForPastMonth() {
    const monthlyBill = await this.callService.getDetailsForPastMonth();
    return { message: 'Bills fetched successfully', data: monthlyBill.length };
  }

  @Get('monthly-cost')
  async getTotalCostForPastMonth() {
    const cost = await this.callService.getTotalCostForPastMonth();
    return { message: 'Monthly cost fetched successfully', data: cost };
  }

  @Get(':phone_or_email')
  async getCallDetails(@Param('phone_or_email') phone_or_email: string) {
    const callsDetails = await this.callService.getCallDetails(phone_or_email);
    return { data: callsDetails };
  }
}
