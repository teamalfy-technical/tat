import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.NODE_ENV  !== 'PRODUCTION' ? '*' : ['https://tasteaccratour.zuludesks.com/', 'https://api.bland.ai'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  await app.listen(8000);
}
bootstrap();
