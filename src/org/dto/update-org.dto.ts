import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrgDto {
  @ApiProperty({ example: 'EV Technology Pvt. Ltd' })
  name: string;
  @ApiProperty({ example: 'sk@sk.com' })
  email: string;
  @ApiProperty({ example: '+919819658936' })
  phone?: string;
  @ApiProperty({ example: 'Devi Mandir, Khatriwara, Sikandrabad, UP 203205' })
  address?: string;
}
