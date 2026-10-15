import { Body, Controller, Post } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AiService } from "./ai.service";

class ChatDto {
  question!: string;
  context?: string;
}

@Controller("ai")
@Injectable()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post("chat")
  async chat(@Body() dto: ChatDto, @CurrentUser() user: { id: string }): Promise<Observable<{ data: string }>> {
    return this.aiService.chat(dto.question, dto.context ?? "");
  }
}
