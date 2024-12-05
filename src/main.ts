import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { writeFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('EV Charging Station Management System')
    .setDescription('EV Charging Station Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const theme = new SwaggerTheme();
  const options = {
    jsonDocumentUrl: '/swagger-spec.json',
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK_MONOKAI),
    customSiteTitle: 'EV Charging Station API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      defaultModelsExpandDepth: 3,
    },
  };
  // await writeFileSync('./swagger-spec.json', JSON.stringify(document));
  SwaggerModule.setup('api', app, documentFactory, options);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  setupSwagger(app);

  const configService = app.get<ConfigService>(ConfigService);

  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
  });

  await app.listen(configService.get('PORT') || 3001);
}
bootstrap();
