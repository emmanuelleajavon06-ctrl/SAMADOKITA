import { Controller, Get, Query } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CacheTTL } from "../../common/decorators/cache.decorator";
import { SearchService } from "./search.service";

@Controller("search")
@Injectable()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @CacheTTL(30)
  global(
    @CurrentUser() user: { infrastructureId: string; role: string },
    @Query("q") q: string
  ) {
    return this.searchService.global(user, q);
  }
}
