import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Data transfer objects for user management
export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
}

// Response transformers to ensure secure data handling
export class UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponse>) {
    Object.assign(this, partial);
  }

  static fromEntity(user: User): UserResponse {
    // Transform user entity to response, excluding sensitive data
    const { password, ...userResponse } = user;
    return new UserResponse(userResponse);
  }
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Transform raw database user to safe response
  private transformToResponse(user: User): UserResponse {
    return UserResponse.fromEntity(user);
  }

  async createUser(data: CreateUserDto): Promise<UserResponse> {
    try {
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
      });

      return this.transformToResponse(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async findAllUsers(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserResponse[]> {
    const users = await this.prisma.user.findMany({
      ...params,
      include: {
        organization: true,
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    return users.map((user) => this.transformToResponse(user));
  }

  async findUserById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        projectMembers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.transformToResponse(user);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: {
          organization: true,
          projectMembers: {
            include: {
              project: true,
            },
          },
        },
      });

      return this.transformToResponse(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async deleteUser(id: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });

      return this.transformToResponse(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`User with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new ConflictException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return this.transformToResponse(updatedUser);
  }
}
