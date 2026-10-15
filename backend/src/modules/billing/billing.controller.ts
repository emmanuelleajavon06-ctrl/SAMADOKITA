import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuditAction } from "../../common/decorators/audit-log.decorator";
import { CacheTTL, SkipCache } from "../../common/decorators/cache.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { SkipSubscription } from "../../common/decorators/skip-subscription.decorator";
import { BillingService } from "./billing.service";
import { PaymentProvider, SubscriptionPlan } from "@prisma/client";

@Controller("billing")
@Injectable()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Post("subscribe")
  @AuditAction("BILLING_SUBSCRIBE")
  @SkipCache()
  subscribe(
    @Body() body: { plan: SubscriptionPlan; provider: PaymentProvider },
    @CurrentUser() user: { infrastructureId: string }
  ) {
    return this.billingService.createSubscription(user.infrastructureId, body.plan, body.provider);
  }

  @Get("confirm/:transactionId")
  @SkipCache()
  confirm(@Param("transactionId") transactionId: string) {
    return this.billingService.confirmPayment(transactionId);
  }

  @Public()
  @SkipSubscription()
  @Post("webhook/:provider")
  @SkipCache()
  webhook(
    @Param("provider") provider: PaymentProvider,
    @Body() payload: Record<string, unknown>,
    @Headers("x-signature") signature: string
  ) {
    return this.billingService.handleWebhook(provider, payload, signature);
  }

  @Get("history")
  @CacheTTL(60)
  history(@CurrentUser() user: { infrastructureId: string }) {
    return this.billingService.getHistory(user.infrastructureId);
  }
}
