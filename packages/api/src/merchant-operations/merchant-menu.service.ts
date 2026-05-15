import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateCategoryDto,
  CreateMenuItemDto,
  PatchMenuItemAvailabilityDto,
  UpdateCategoryDto,
  UpdateMenuItemDto,
} from './dto/menu.dto';
import { slugify, uniqueSlugCandidate } from './utils/slug';

@Injectable()
export class MerchantMenuService {
  constructor(private readonly supabase: SupabaseService) {}

  async listCategories(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('categories')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('display_order', { ascending: true });

    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async createCategory(
    merchantId: string,
    dto: CreateCategoryDto,
  ): Promise<unknown> {
    const slug = await this.allocateUniqueSlug('categories', merchantId, dto.name);
    const { data, error } = await this.supabase.db
      .from('categories')
      .insert({
        merchant_id: merchantId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() ?? null,
        image_url: dto.image_url?.trim() ?? null,
        display_order: dto.display_order ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async updateCategory(
    merchantId: string,
    categoryId: string,
    dto: UpdateCategoryDto,
  ): Promise<unknown> {
    await this.assertCategoryOwned(merchantId, categoryId);
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description?.trim() ?? null;
    if (dto.image_url !== undefined) patch.image_url = dto.image_url?.trim() ?? null;
    if (dto.display_order !== undefined) patch.display_order = dto.display_order;
    if (dto.is_active !== undefined) patch.is_active = dto.is_active;

    const { data, error } = await this.supabase.db
      .from('categories')
      .update(patch)
      .eq('id', categoryId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Category not found');
    }
    return data;
  }

  async deleteCategory(merchantId: string, categoryId: string): Promise<void> {
    await this.assertCategoryOwned(merchantId, categoryId);
    const { error } = await this.supabase.db
      .from('categories')
      .delete()
      .eq('id', categoryId)
      .eq('merchant_id', merchantId);
    if (error) {
      throw new ConflictException(error.message);
    }
  }

  async listItems(merchantId: string, categoryId?: string): Promise<unknown[]> {
    let q = this.supabase.db
      .from('menu_items')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('display_order', { ascending: true });
    if (categoryId) {
      q = q.eq('category_id', categoryId);
    }
    const { data, error } = await q;
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async createItem(merchantId: string, dto: CreateMenuItemDto): Promise<unknown> {
    await this.assertCategoryOwned(merchantId, dto.category_id);
    const slug = await this.allocateUniqueSlug('menu_items', merchantId, dto.name);
    const insertRow: Record<string, unknown> = {
      merchant_id: merchantId,
      category_id: dto.category_id,
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim() ?? null,
      price: dto.price,
      compare_price: dto.compare_price ?? null,
      image_url: dto.image_url?.trim() ?? null,
      is_available: dto.is_available ?? true,
      display_order: dto.display_order ?? 0,
    };
    if (dto.stock_quantity !== undefined) {
      insertRow.stock_quantity = dto.stock_quantity;
    }

    const { data, error } = await this.supabase.db
      .from('menu_items')
      .insert(insertRow)
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async updateItem(
    merchantId: string,
    itemId: string,
    dto: UpdateMenuItemDto,
  ): Promise<unknown> {
    await this.assertMenuItemOwned(merchantId, itemId);
    if (dto.category_id) {
      await this.assertCategoryOwned(merchantId, dto.category_id);
    }

    const patch: Record<string, unknown> = {};
    if (dto.category_id !== undefined) patch.category_id = dto.category_id;
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.description !== undefined) patch.description = dto.description?.trim() ?? null;
    if (dto.price !== undefined) patch.price = dto.price;
    if (dto.compare_price !== undefined) patch.compare_price = dto.compare_price;
    if (dto.image_url !== undefined) patch.image_url = dto.image_url?.trim() ?? null;
    if (dto.is_available !== undefined) patch.is_available = dto.is_available;
    if (dto.display_order !== undefined) patch.display_order = dto.display_order;
    if (dto.stock_quantity !== undefined) patch.stock_quantity = dto.stock_quantity;

    const { data, error } = await this.supabase.db
      .from('menu_items')
      .update(patch)
      .eq('id', itemId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Menu item not found');
    }
    return data;
  }

  async patchItemAvailability(
    merchantId: string,
    itemId: string,
    dto: PatchMenuItemAvailabilityDto,
  ): Promise<unknown> {
    await this.assertMenuItemOwned(merchantId, itemId);
    const { data, error } = await this.supabase.db
      .from('menu_items')
      .update({ is_available: dto.is_available })
      .eq('id', itemId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(error?.message ?? 'Menu item not found');
    }
    return data;
  }

  private async assertCategoryOwned(
    merchantId: string,
    categoryId: string,
  ): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('categories')
      .select('id')
      .eq('id', categoryId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error || !data) {
      throw new ForbiddenException('Category not found for this merchant.');
    }
  }

  private async assertMenuItemOwned(
    merchantId: string,
    itemId: string,
  ): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('menu_items')
      .select('id')
      .eq('id', itemId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error || !data) {
      throw new ForbiddenException('Menu item not found for this merchant.');
    }
  }

  private async allocateUniqueSlug(
    table: 'categories' | 'menu_items',
    merchantId: string,
    name: string,
  ): Promise<string> {
    const mid = merchantId.replace(/-/g, '').slice(0, 8);
    let candidate = `${slugify(name)}-${mid}`;
    for (let i = 0; i < 30; i++) {
      const { data } = await this.supabase.db
        .from(table)
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!data) return candidate;
      candidate = uniqueSlugCandidate(`${slugify(name)}-${mid}`);
    }
    throw new ConflictException('Could not allocate a unique slug');
  }

  menuImportTemplateCsv(): string {
    return [
      'category_name,name,description,price,compare_price,image_url,is_available,stock_quantity,display_order',
      'Example mains,Jollof rice,Smoky party-style,3500,,,true,,0',
      'Example mains,Fried rice,,3200,3600,,true,20,1',
    ].join('\n');
  }

  /**
   * Import menu rows from CSV. Creates categories when `category_name` is new.
   * Header row required; UTF-8; commas inside fields should be quoted with ".
   */
  async importFromCsv(
    merchantId: string,
    csv: string,
  ): Promise<{
    created: number;
    errors: { line: number; message: string }[];
  }> {
    const errors: { line: number; message: string }[] = [];
    let created = 0;
    const lines = csv
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV must include a header row and at least one data row.');
    }

    const headerCells = this.splitCsvLine(lines[0]).map((h) =>
      h.trim().toLowerCase().replace(/^\ufeff/, ''),
    );
    const col = (name: string): number => headerCells.indexOf(name);

    const ixCat = col('category_name');
    const ixName = col('name');
    const ixDesc = col('description');
    const ixPrice = col('price');
    const ixCompare = col('compare_price');
    const ixImg = col('image_url');
    const ixAvail = col('is_available');
    const ixStock = col('stock_quantity');
    const ixOrder = col('display_order');

    if (ixCat < 0 || ixName < 0 || ixPrice < 0) {
      throw new BadRequestException(
        'CSV header must include category_name, name, and price columns.',
      );
    }

    const categoryCache = new Map<string, string>();

    for (let i = 1; i < lines.length; i++) {
      const lineNo = i + 1;
      const cells = this.splitCsvLine(lines[i]);
      const pick = (idx: number): string | undefined => {
        if (idx < 0) return undefined;
        const v = cells[idx]?.trim();
        return v === '' ? undefined : v;
      };

      const categoryName = pick(ixCat);
      const itemName = pick(ixName);
      const priceRaw = pick(ixPrice);

      if (!categoryName || !itemName || !priceRaw) {
        errors.push({
          line: lineNo,
          message: 'Missing category_name, name, or price.',
        });
        continue;
      }

      const price = Number(priceRaw);
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ line: lineNo, message: 'Invalid price.' });
        continue;
      }

      let categoryId = categoryCache.get(categoryName.toLowerCase());
      if (!categoryId) {
        try {
          categoryId = await this.resolveOrCreateCategoryId(
            merchantId,
            categoryName,
          );
          categoryCache.set(categoryName.toLowerCase(), categoryId);
        } catch (e) {
          errors.push({
            line: lineNo,
            message: e instanceof Error ? e.message : 'Category error',
          });
          continue;
        }
      }

      const dto: CreateMenuItemDto = {
        category_id: categoryId,
        name: itemName,
        description: pick(ixDesc),
        price,
      };
      const cp = pick(ixCompare);
      if (cp !== undefined) {
        const compare = Number(cp);
        if (Number.isFinite(compare) && compare >= 0) {
          dto.compare_price = compare;
        }
      }
      const img = pick(ixImg);
      if (img !== undefined) dto.image_url = img;

      const availRaw = pick(ixAvail);
      if (availRaw !== undefined) {
        const low = availRaw.toLowerCase();
        dto.is_available = low === 'true' || low === '1' || low === 'yes';
      }

      const orderRaw = pick(ixOrder);
      if (orderRaw !== undefined) {
        const d = parseInt(orderRaw, 10);
        if (Number.isFinite(d)) dto.display_order = d;
      }

      const stockRaw = pick(ixStock);
      if (stockRaw !== undefined) {
        const s = parseInt(stockRaw, 10);
        if (Number.isFinite(s) && s >= 0) dto.stock_quantity = s;
      }

      try {
        await this.createItem(merchantId, dto);
        created += 1;
      } catch (e) {
        errors.push({
          line: lineNo,
          message: e instanceof Error ? e.message : 'Insert failed',
        });
      }
    }

    return { created, errors };
  }

  private splitCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === ',' && !inQ) {
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  private async resolveOrCreateCategoryId(
    merchantId: string,
    name: string,
  ): Promise<string> {
    const trimmed = name.trim();
    const { data: existing, error: qErr } = await this.supabase.db
      .from('categories')
      .select('id')
      .eq('merchant_id', merchantId)
      .ilike('name', trimmed)
      .maybeSingle();
    if (qErr) {
      throw new ConflictException(qErr.message);
    }
    if (existing?.id) {
      return existing.id as string;
    }
    const row = await this.createCategory(merchantId, { name: trimmed });
    return (row as { id: string }).id;
  }
}
