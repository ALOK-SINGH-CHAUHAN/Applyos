// Reload trigger: 2026-07-26 12:08
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[API Gateway] Server running on port ${port}`);
}
bootstrap();
