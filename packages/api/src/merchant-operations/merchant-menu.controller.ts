import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import {
  MerchantJwtGuard,
  MerchantJwtPayload,
} from '../merchant-auth/guards/merchant-jwt.guard';
import {
  CreateCategoryDto,
  CreateMenuItemDto,
  PatchMenuItemAvailabilityDto,
  UpdateCategoryDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { ImportMenuCsvDto } from './dto/menu-import.dto';
import { MerchantVerifiedGuard } from '../merchant-auth/guards/merchant-verified.guard';
import { MerchantMenuService } from './merchant-menu.service';

@Controller('merchant/menu')
@UseGuards(MerchantJwtGuard, MerchantVerifiedGuard)
export class MerchantMenuController {
  constructor(private readonly menu: MerchantMenuService) {}

  @Get('import/template')
  @Header('Content-Disposition', 'attachment; filename="menu-import-template.csv"')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  importTemplate(): string {
    return this.menu.menuImportTemplateCsv();
  }

  @Post('import')
  importCsv(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: ImportMenuCsvDto,
  ): Promise<{ created: number; errors: { line: number; message: string }[] }> {
    return this.menu.importFromCsv(req.merchant.merchantId, dto.csv);
  }

  @Get('categories')
  listCategories(
    @Req() req: Request & { merchant: MerchantJwtPayload },
  ): Promise<unknown[]> {
    return this.menu.listCategories(req.merchant.merchantId);
  }

  @Post('categories')
  createCategory(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: CreateCategoryDto,
  ): Promise<unknown> {
    return this.menu.createCategory(req.merchant.merchantId, dto);
  }

  @Put('categories/:id')
  updateCategory(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<unknown> {
    return this.menu.updateCategory(req.merchant.merchantId, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.menu.deleteCategory(req.merchant.merchantId, id);
  }

  @Get('items')
  listItems(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Query('category_id') categoryId?: string,
  ): Promise<unknown[]> {
    return this.menu.listItems(
      req.merchant.merchantId,
      categoryId && categoryId.length > 0 ? categoryId : undefined,
    );
  }

  @Post('items')
  createItem(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Body() dto: CreateMenuItemDto,
  ): Promise<unknown> {
    return this.menu.createItem(req.merchant.merchantId, dto);
  }

  @Put('items/:id')
  updateItem(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMenuItemDto,
  ): Promise<unknown> {
    return this.menu.updateItem(req.merchant.merchantId, id, dto);
  }

  @Patch('items/:id/availability')
  patchAvailability(
    @Req() req: Request & { merchant: MerchantJwtPayload },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PatchMenuItemAvailabilityDto,
  ): Promise<unknown> {
    return this.menu.patchItemAvailability(req.merchant.merchantId, id, dto);
  }
}
