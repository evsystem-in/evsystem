import { SetMetadata } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export const Public = () => {
  return applyDecorators(
    SetMetadata('isPublic', true),
    ApiOperation({ security: [] }), // Removes security requirement in Swagger
    ApiResponse({ status: 200 }),
  );
};
