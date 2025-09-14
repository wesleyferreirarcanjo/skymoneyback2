import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

// Set environment variable for data generation based on command line arguments
if (process.argv.includes('--generate-test-data')) {
  process.env.GENERATE_TEST_DATA = 'true';
}

// Also check for DATA_GENERATED environment variable
if (process.env.DATA_GENERATED === 'true') {
  process.env.GENERATE_TEST_DATA = 'true';
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files for uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable validation pipes globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'], // Allow all headers
    exposedHeaders: ['*'], // Expose all headers
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

}
bootstrap();
