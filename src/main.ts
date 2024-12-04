import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { writeFileSync } from 'fs';

export function setupSwagger(app: INestApplication): void {
  // Create Swagger document configuration
  const config = new DocumentBuilder()
    // Basic API information
    .setTitle('EV Charging Station API')
    .setDescription(
      `
      API Documentation for EV Charging Station Management System.
      
    `,
    )
    .setVersion('1.0')
    // Add security scheme
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'accessToken', // This name here is important for references
    )
    // Add common tags
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('organizations', 'Organization management endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('stations', 'Station management endpoints')
    .build();

  // Create Swagger document
  const document = SwaggerModule.createDocument(app, config);

  // Add security requirements globally
  // This makes the 'Authorize' button appear on all endpoints by default
  document.security = [{ accessToken: [] }];

  // Optional: Customize paths to exclude authentication
  // Remove authentication from public endpoints
  // const publicPaths = ['/auth/login', '/auth/register'];
  // for (const path in document.paths) {
  //   if (publicPaths.includes(path)) {
  //     for (const method in document.paths[path]) {
  //       delete document.paths[path][method].security;
  //     }
  //   }
  // }

  // Optional: Add response examples
  for (const path in document.paths) {
    for (const method in document.paths[path]) {
      const operation = document.paths[path][method];
      if (!operation.responses['401']) {
        operation.responses['401'] = {
          description: 'Unauthorized - Invalid or missing token',
        };
      }
      if (!operation.responses['403']) {
        operation.responses['403'] = {
          description: 'Forbidden - Insufficient permissions',
        };
      }
    }
  }

  // Optional: Save Swagger JSON to file
  if (process.env.NODE_ENV === 'development') {
    writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));
  }

  // Apply custom theme
  const theme = new SwaggerTheme();
  const darkStyle = theme.getBuffer(SwaggerThemeNameEnum.DARK);
  const options = {
    explorer: true,
    customCss: darkStyle,
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

  // Setup Swagger in the app
  SwaggerModule.setup('api', app, document, options);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  setupSwagger(app);
  await app.listen(3001);
}
bootstrap();
