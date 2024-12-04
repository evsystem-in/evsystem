import { IsOptional, IsString } from 'class-validator';

// Query DTO for filtering organizations
export class OrgQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  includeRelations?: boolean;
}
