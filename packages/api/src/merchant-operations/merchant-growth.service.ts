import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';
import {
  BookFeaturedSlotDto,
  ChatMessageDto,
  CreateMerchantLocationDto,
  MarketingAudienceDto,
  MarketingCampaignDto,
  MerchantVatRecordDto,
  ReferralInviteDto,
} from './dto/growth.dto';

@Injectable()
export class MerchantGrowthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private async requireFlag(flagKey: string): Promise<void> {
    const { data, error } = await this.supabase.db
      .from('platform_feature_flags')
      .select('enabled')
      .eq('flag_key', flagKey)
      .maybeSingle();
    if (error || !data?.enabled) {
      throw new ForbiddenException(
        `Feature "${flagKey}" is disabled for this platform.`,
      );
    }
  }

  async listReferrals(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('merchant_referrals');
    const { data, error } = await this.supabase.db
      .from('merchant_referrals')
      .select('*')
      .eq('referrer_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async inviteReferral(merchantId: string, dto: ReferralInviteDto): Promise<unknown> {
    await this.requireFlag('merchant_referrals');
    const email = dto.email.trim().toLowerCase();
    const { data, error } = await this.supabase.db
      .from('merchant_referrals')
      .insert({
        referrer_id: merchantId,
        referred_email: email,
        status: 'pending',
      })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') {
        throw new ConflictException('That referral is already recorded.');
      }
      throw new ConflictException(error.message);
    }
    return data;
  }

  async listLocations(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('multi_location_merchant');
    const { data, error } = await this.supabase.db
      .from('merchant_locations')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async createLocation(
    merchantId: string,
    dto: CreateMerchantLocationDto,
  ): Promise<unknown> {
    await this.requireFlag('multi_location_merchant');
    if (dto.is_primary) {
      await this.supabase.db
        .from('merchant_locations')
        .update({ is_primary: false })
        .eq('merchant_id', merchantId);
    }
    const { data, error } = await this.supabase.db
      .from('merchant_locations')
      .insert({
        merchant_id: merchantId,
        name: dto.name.trim(),
        address_line: dto.address_line?.trim() ?? null,
        city: dto.city?.trim() ?? null,
        state: dto.state?.trim() ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        is_primary: dto.is_primary ?? false,
        is_active: true,
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async deleteLocation(merchantId: string, locationId: string): Promise<void> {
    await this.requireFlag('multi_location_merchant');
    const { error } = await this.supabase.db
      .from('merchant_locations')
      .delete()
      .eq('id', locationId)
      .eq('merchant_id', merchantId);
    if (error) {
      throw new ConflictException(error.message);
    }
  }

  async listVatRemittance(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('vat_remittance');
    const { data, error } = await this.supabase.db
      .from('merchant_vat_remittance')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('period_start', { ascending: false })
      .limit(100);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async recordVatRemittance(
    merchantId: string,
    dto: MerchantVatRecordDto,
  ): Promise<unknown> {
    await this.requireFlag('vat_remittance');
    const { data, error } = await this.supabase.db
      .from('merchant_vat_remittance')
      .insert({
        merchant_id: merchantId,
        period_start: dto.period_start,
        period_end: dto.period_end,
        vat_amount_ngn: dto.vat_amount_ngn,
        reference: dto.reference?.trim() ?? null,
        notes: dto.notes?.trim() ?? null,
        status: 'recorded',
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async listInvoices(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('merchant_invoice_pdf');
    const { data, error } = await this.supabase.db
      .from('merchant_invoices')
      .select(
        'id, invoice_number, period_start, period_end, total_orders, gross_revenue, commission_paid, vat_collected, net_earnings, total_withdrawn, closing_balance, pdf_url, generated_at',
      )
      .eq('merchant_id', merchantId)
      .order('generated_at', { ascending: false })
      .limit(50);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async getInvoiceHtml(merchantId: string, invoiceId: string): Promise<string> {
    await this.requireFlag('merchant_invoice_pdf');
    const { data: inv, error } = await this.supabase.db
      .from('merchant_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (error) {
      throw new ConflictException(error.message);
    }
    if (!inv) {
      throw new NotFoundException('Invoice not found');
    }
    const row = inv as Record<string, unknown>;
    const name = this.config.get('platform.name', { infer: true });
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${row.invoice_number ?? ''}</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:1rem;border:1px solid #e5e7eb;border-radius:12px}
h1{font-size:1.25rem} table{width:100%;border-collapse:collapse} td{padding:6px 0;border-bottom:1px solid #f3f4f6}</style></head><body>
<h1>${name} — merchant statement</h1>
<p><strong>Invoice</strong> ${String(row.invoice_number ?? '—')}</p>
<p>Period <strong>${String(row.period_start ?? '')}</strong> to <strong>${String(row.period_end ?? '')}</strong></p>
<table>
<tr><td>Total orders</td><td style="text-align:right">${String(row.total_orders ?? '—')}</td></tr>
<tr><td>Gross revenue</td><td style="text-align:right">₦${Number(row.gross_revenue ?? 0).toLocaleString('en-NG')}</td></tr>
<tr><td>Commission paid</td><td style="text-align:right">₦${Number(row.commission_paid ?? 0).toLocaleString('en-NG')}</td></tr>
<tr><td>VAT collected</td><td style="text-align:right">₦${Number(row.vat_collected ?? 0).toLocaleString('en-NG')}</td></tr>
<tr><td>Net earnings</td><td style="text-align:right">₦${Number(row.net_earnings ?? 0).toLocaleString('en-NG')}</td></tr>
<tr><td>Total withdrawn</td><td style="text-align:right">₦${Number(row.total_withdrawn ?? 0).toLocaleString('en-NG')}</td></tr>
<tr><td><strong>Closing balance</strong></td><td style="text-align:right"><strong>₦${Number(row.closing_balance ?? 0).toLocaleString('en-NG')}</strong></td></tr>
</table>
<p style="font-size:0.85rem;color:#6b7280">Generated ${String(row.generated_at ?? '')}. Use browser Print → Save as PDF for a PDF copy.</p>
</body></html>`;
  }

  async listFeaturedSlots(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('paid_featured_placement');
    const { data, error } = await this.supabase.db
      .from('merchant_featured_slots')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('start_date', { ascending: false })
      .limit(50);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async bookFeaturedSlot(
    merchantId: string,
    dto: BookFeaturedSlotDto,
  ): Promise<unknown> {
    await this.requireFlag('paid_featured_placement');
    if (dto.end_date < dto.start_date) {
      throw new ConflictException('end_date must be on or after start_date.');
    }
    const { data, error } = await this.supabase.db
      .from('merchant_featured_slots')
      .insert({
        merchant_id: merchantId,
        slot_type: dto.slot_type,
        start_date: dto.start_date,
        end_date: dto.end_date,
        amount_paid: dto.amount_paid ?? 0,
        is_active: true,
        ops_approved: false,
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Booking failed');
    }
    return data;
  }

  async listMarketingAudience(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('merchant_email_marketing');
    const { data, error } = await this.supabase.db
      .from('merchant_marketing_audience')
      .select('id, email_normalized, opted_in, source, created_at')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async upsertMarketingAudience(
    merchantId: string,
    dto: MarketingAudienceDto,
  ): Promise<unknown> {
    await this.requireFlag('merchant_email_marketing');
    const email = dto.email.trim().toLowerCase();
    const { data: existing } = await this.supabase.db
      .from('merchant_marketing_audience')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('email_normalized', email)
      .maybeSingle();
    const payload = {
      opted_in: dto.opted_in !== false,
      source: 'manual',
    };
    if (existing?.id) {
      const { data, error } = await this.supabase.db
        .from('merchant_marketing_audience')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error || !data) {
        throw new ConflictException(error?.message ?? 'Update failed');
      }
      return data;
    }
    const { data, error } = await this.supabase.db
      .from('merchant_marketing_audience')
      .insert({
        merchant_id: merchantId,
        email_normalized: email,
        ...payload,
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async listMarketingCampaigns(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('merchant_email_marketing');
    const { data, error } = await this.supabase.db
      .from('merchant_marketing_campaigns')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async createMarketingCampaign(
    merchantId: string,
    dto: MarketingCampaignDto,
  ): Promise<unknown> {
    await this.requireFlag('merchant_email_marketing');
    const { data, error } = await this.supabase.db
      .from('merchant_marketing_campaigns')
      .insert({
        merchant_id: merchantId,
        subject: dto.subject.trim(),
        body_plain: dto.body_plain,
        status: 'draft',
        weekly_cap_per_recipient: dto.weekly_cap_per_recipient ?? 2,
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Insert failed');
    }
    return data;
  }

  async sendMarketingCampaign(
    merchantId: string,
    campaignId: string,
  ): Promise<{ sent: number; skipped_cap: number; errors: number }> {
    await this.requireFlag('merchant_email_marketing');
    const { data: camp, error: cErr } = await this.supabase.db
      .from('merchant_marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (cErr || !camp) {
      throw new NotFoundException('Campaign not found');
    }
    if ((camp as { status: string }).status === 'sent') {
      throw new ConflictException('Campaign already sent.');
    }

    const { data: audience, error: aErr } = await this.supabase.db
      .from('merchant_marketing_audience')
      .select('email_normalized')
      .eq('merchant_id', merchantId)
      .eq('opted_in', true)
      .limit(500);
    if (aErr) {
      throw new ConflictException(aErr.message);
    }

    const cap = Number(
      (camp as { weekly_cap_per_recipient?: number }).weekly_cap_per_recipient ??
        2,
    );
    const subject = String((camp as { subject: string }).subject);
    let body = String((camp as { body_plain: string }).body_plain);
    const unsub =
      '\n\n—\nUnsubscribe: reply STOP or contact support to opt out (NDPR).';
    body += unsub;

    const sgKey = this.config.get('sendgrid.apiKey', { infer: true });
    const fromEmail = this.config.get('sendgrid.fromEmail', { infer: true });
    const fromName = this.config.get('sendgrid.fromName', { infer: true });

    let sent = 0;
    let skipped_cap = 0;
    let errors = 0;

    const { data: campRows } = await this.supabase.db
      .from('merchant_marketing_campaigns')
      .select('id')
      .eq('merchant_id', merchantId);
    const merchantCampaignIds = (campRows ?? []).map((r) => r.id as string);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    for (const row of audience ?? []) {
      const email = row.email_normalized as string;
      let recentCount = 0;
      if (merchantCampaignIds.length > 0) {
        const { count, error: cntErr } = await this.supabase.db
          .from('merchant_marketing_sends')
          .select('id', { count: 'exact', head: true })
          .eq('email_normalized', email)
          .gte('sent_at', weekAgo)
          .in('campaign_id', merchantCampaignIds);
        if (cntErr) {
          errors += 1;
          continue;
        }
        recentCount = count ?? 0;
      }
      if (recentCount >= cap) {
        skipped_cap += 1;
        continue;
      }

      let providerStatus = 'sent';
      let errMsg: string | null = null;

      if (sgKey && fromEmail) {
        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sgKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: fromEmail, name: fromName },
            subject,
            content: [{ type: 'text/plain', value: body }],
          }),
        });
        if (!res.ok) {
          const t = await res.text();
          providerStatus = 'error';
          errMsg = t.slice(0, 500);
          errors += 1;
        } else {
          sent += 1;
        }
      } else {
        providerStatus = 'dry_run_no_sendgrid';
        sent += 1;
      }

      await this.supabase.db.from('merchant_marketing_sends').insert({
        campaign_id: campaignId,
        email_normalized: email,
        provider_status: providerStatus,
        error_message: errMsg,
      });
    }

    await this.supabase.db
      .from('merchant_marketing_campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('merchant_id', merchantId);

    return { sent, skipped_cap, errors };
  }

  private async getOrCreateChatThreadId(merchantId: string): Promise<string> {
    const { data: existing } = await this.supabase.db
      .from('merchant_support_chat_threads')
      .select('id')
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (existing?.id) {
      return existing.id as string;
    }
    const { data: created, error } = await this.supabase.db
      .from('merchant_support_chat_threads')
      .insert({ merchant_id: merchantId })
      .select('id')
      .single();
    if (error || !created) {
      throw new ConflictException(error?.message ?? 'Could not open chat');
    }
    return created.id as string;
  }

  async listChatMessages(merchantId: string): Promise<unknown[]> {
    await this.requireFlag('merchant_support_chat');
    const { data: th } = await this.supabase.db
      .from('merchant_support_chat_threads')
      .select('id')
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (!th?.id) {
      return [];
    }
    const threadId = th.id as string;
    const { data, error } = await this.supabase.db
      .from('merchant_support_chat_messages')
      .select('id, author_role, body, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) {
      throw new ConflictException(error.message);
    }
    return data ?? [];
  }

  async postChatMessage(
    merchantId: string,
    userId: string | undefined,
    dto: ChatMessageDto,
  ): Promise<unknown> {
    await this.requireFlag('merchant_support_chat');
    const threadId = await this.getOrCreateChatThreadId(merchantId);
    const { data, error } = await this.supabase.db
      .from('merchant_support_chat_messages')
      .insert({
        thread_id: threadId,
        author_role: 'merchant',
        body: dto.body.trim(),
        created_by: userId ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new ConflictException(error?.message ?? 'Send failed');
    }
    await this.supabase.db
      .from('merchant_support_chat_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);
    return data;
  }
}
