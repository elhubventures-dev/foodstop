import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../supabase/supabase.service';
import {
  CreateSupportTicketDto,
  PatchSupportTicketDto,
  PostSupportMessageDto,
} from './dto/support.dto';

@Injectable()
export class MerchantSupportService {
  constructor(private readonly supabase: SupabaseService) {}

  async listTickets(merchantId: string): Promise<unknown[]> {
    const { data, error } = await this.supabase.db
      .from('merchant_support_tickets')
      .select(
        'id, subject, status, priority, created_at, updated_at, created_by',
      )
      .eq('merchant_id', merchantId)
      .order('updated_at', { ascending: false })
      .limit(100);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async createTicket(
    merchantId: string,
    userId: string | undefined,
    dto: CreateSupportTicketDto,
  ): Promise<unknown> {
    if (!userId) {
      throw new BadRequestException('Profile id missing from session.');
    }
    const { data: ticket, error: tErr } = await this.supabase.db
      .from('merchant_support_tickets')
      .insert({
        merchant_id: merchantId,
        subject: dto.subject.trim(),
        priority: dto.priority ?? 'normal',
        status: 'open',
        created_by: userId,
      })
      .select()
      .single();

    if (tErr || !ticket) {
      throw new ConflictException(tErr?.message ?? 'Could not create ticket');
    }

    const ticketId = ticket.id as string;
    if (dto.body?.trim()) {
      const { error: mErr } = await this.supabase.db
        .from('merchant_support_messages')
        .insert({
          ticket_id: ticketId,
          author_role: 'merchant',
          body: dto.body.trim(),
          created_by: userId,
        });
      if (mErr) {
        throw new ConflictException(mErr.message);
      }
    }

    return this.getTicket(merchantId, ticketId);
  }

  async getTicket(merchantId: string, ticketId: string): Promise<unknown> {
    const { data: ticket, error: tErr } = await this.supabase.db
      .from('merchant_support_tickets')
      .select(
        'id, subject, status, priority, created_at, updated_at, created_by, merchant_id',
      )
      .eq('id', ticketId)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (tErr) {
      throw new ConflictException(tErr.message);
    }
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const { data: messages, error: mErr } = await this.supabase.db
      .from('merchant_support_messages')
      .select('id, author_role, body, created_at, created_by')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (mErr) {
      throw new ConflictException(mErr.message);
    }

    return { ...ticket, messages: messages ?? [] };
  }

  async postMessage(
    merchantId: string,
    ticketId: string,
    userId: string | undefined,
    dto: PostSupportMessageDto,
  ): Promise<unknown> {
    if (!userId) {
      throw new BadRequestException('Profile id missing from session.');
    }
    await this.assertTicket(merchantId, ticketId);

    const { data, error } = await this.supabase.db
      .from('merchant_support_messages')
      .insert({
        ticket_id: ticketId,
        author_role: 'merchant',
        body: dto.body.trim(),
        created_by: userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Message failed');
    }

    await this.supabase.db
      .from('merchant_support_tickets')
      .update({
        status: 'awaiting_ops',
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('merchant_id', merchantId);

    return data;
  }

  async patchTicket(
    merchantId: string,
    ticketId: string,
    dto: PatchSupportTicketDto,
  ): Promise<unknown> {
    await this.assertTicket(merchantId, ticketId);
    const patch: Record<string, unknown> = {};
    if (dto.subject !== undefined) patch.subject = dto.subject.trim();
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.status !== undefined) patch.status = dto.status;

    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No changes.');
    }
    patch.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase.db
      .from('merchant_support_tickets')
      .update(patch)
      .eq('id', ticketId)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Update failed');
    }
    return data;
  }

  private async assertTicket(
    merchantId: string,
    ticketId: string,
  ): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('merchant_support_tickets')
      .select('id')
      .eq('id', ticketId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error || !data) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
