import { Controller } from '@nestjs/common';
import { OcppService } from './ocpp.service';

@Controller('ocpp')
export class OcppController {
  constructor(private readonly ocppService: OcppService) {}
}
