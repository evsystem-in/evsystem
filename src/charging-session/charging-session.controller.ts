import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Put,
} from '@nestjs/common';
import { ChargingSessionService } from './charging-session.service';
import { StartSessionDto } from './dto/charging-session.dto';

@Controller('charging-sessions')
export class ChargingSessionController {
  constructor(private sessionService: ChargingSessionService) {}

  @Post()
  async startSession(@Req() req, @Body() data: StartSessionDto) {
    return this.sessionService.startSession({
      userId: req.user.id,
      ...data,
    });
  }

  @Put(':id/end')
  async endSession(@Param('id') id: string) {
    return this.sessionService.endSession(id);
  }
}
