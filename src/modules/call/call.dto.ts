export class CallDto {
  phone_number: string;
  name: string;
  email: string;
}

export class CallDetailsDto {
  phone_number: string;
  user_email: string;
  transcripts: string;
  call_id: string;
  duration: string;
  status: string;
  summary: string;
  recording_url: string;
  started_at: string;
  price: string;
}
