import { PartialType } from '@nestjs/swagger';
import { CreateChargingSessionDto } from './charging-session.dto';

export class UpdateChargingSessionDto extends PartialType(
  CreateChargingSessionDto,
) {}
