import 'reflect-metadata';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin:
      process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ??
      true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-key'],
  });

  app.setGlobalPrefix('api/v1');

  // Friendly root — all JSON routes live under /api/v1 (Nest does not mount GET / by default).
  app.getHttpAdapter().get('/', (_req, res) => {
    res.status(200).json({
      service: 'ChopFast API',
      basePath: '/api/v1',
      examples: {
        merchantRegister: 'POST /api/v1/merchant/register',
        merchantRequestOtp: 'POST /api/v1/merchant/register/request-otp',
        merchantLogin: 'POST /api/v1/merchant/auth/login',
        paystackWebhook: 'POST /api/v1/webhooks/paystack',
      },
    });
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`ChopFast API listening on :${port}`);
}

void bootstrap();
