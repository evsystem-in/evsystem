import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRole } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { TokenResponse } from './dto/auth-response';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock DTOs and responses
  const mockLoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRegisterDto = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockTokenResponse: TokenResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      role: 'USER',
      phone: '',
      createdAt: undefined,
      updatedAt: undefined,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            generateTokens: jest.fn(),
            register: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        email: mockLoginDto.email,
        role: UserRole.USER,
      };
      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest
        .spyOn(authService, 'generateTokens')
        .mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.login(mockLoginDto);

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.validateUser).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      jest
        .spyOn(authService, 'validateUser')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(controller.login(mockLoginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should successfully register new user', async () => {
      // Arrange
      jest.spyOn(authService, 'register').mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.register(mockRegisterDto);

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens', async () => {
      // Arrange
      const mockRefreshTokenDto = { refreshToken: 'valid-refresh-token' };
      const mockRequest = { user: { id: '1' } };
      jest
        .spyOn(authService, 'refreshTokens')
        .mockResolvedValue(mockTokenResponse);

      // Act
      const result = await controller.refreshToken(
        mockRefreshTokenDto,
        mockRequest,
      );

      // Assert
      expect(result).toEqual(mockTokenResponse);
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockRefreshTokenDto.refreshToken,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const mockRequest = { user: { id: '1' } };
      const logoutSpy = jest
        .spyOn(authService, 'logout')
        .mockResolvedValue(void 0);

      // Act
      await controller.logout(mockRequest);

      // Assert
      expect(logoutSpy).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });
});
