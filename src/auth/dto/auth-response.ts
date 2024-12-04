import { UserRole } from '@prisma/client';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// auth/interfaces/token-response.interface.ts
export interface TokenResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
