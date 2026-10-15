import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { InsuranceService } from "./insurance.service";
import { CreateInsuranceDto, CreateInsurancePolicyDto } from "./dto/create-insurance.dto";

@Controller("insurance")
@Injectable()
export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  @Post()
  @AuditAction("INSURANCE_CREATE")
  @SkipCache()
  createInsurance(
    @Body() dto: CreateInsuranceDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.insuranceService.createInsurance(dto, user.infrastructureId);
  }

  @Get()
  @CacheTTL(60)
  findInsurances(@CurrentUser() user: { infrastructureId: string }) {
    return this.insuranceService.findInsurances(user.infrastructureId);
  }

  @Post("policies")
  @AuditAction("POLICY_CREATE")
  @SkipCache()
  createPolicy(
    @Body() dto: CreateInsurancePolicyDto,
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.insuranceService.createPolicy(dto, user);
  }

  @Get("policies")
  @CacheTTL(60)
  findPolicies(@CurrentUser() user: { infrastructureId: string; role: string }) {
    return this.insuranceService.findPolicies(user);
  }

  @Delete("policies/:id")
  @AuditAction("POLICY_DELETE")
  @SkipCache()
  removePolicy(@Param("id") id: string) {
    return this.insuranceService.removePolicy(id);
  }
}
