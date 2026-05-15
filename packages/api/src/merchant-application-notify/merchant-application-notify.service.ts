import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../config/configuration';
import { MerchantNotificationsService } from '../notifications/merchant-notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  isValidNigerianMobile,
  normalizeNigerianPhoneTo234,
} from '../merchant-registration/utils/nigerian-phone';
import { NotifyMerchantApplicationDto } from './dto/notify-merchant-application.dto';

type MerchantRow = {
  id: string;
  user_id: string | null;
  business_name: string;
  slug: string;
  owner_full_name: string | null;
  owner_phone: string | null;
  business_email: string;
  application_reference: string | null;
  is_verified: boolean;
  is_active: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  application_rfi_message: string | null;
};

@Injectable()
export class MerchantApplicationNotifyService {
  private readonly logger = new Logger(MerchantApplicationNotifyService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly merchantNotifications: MerchantNotificationsService,
  ) {}

  async handleNotify(dto: NotifyMerchantApplicationDto): Promise<{
    ok: boolean;
    email_sent: boolean;
    sms_sent: boolean;
    in_app: boolean;
  }> {
    if (
      (dto.event === 'rejected' || dto.event === 'rfi') &&
      (!dto.message || dto.message.trim().length < 8)
    ) {
      throw new BadRequestException(
        'message is required (min 8 characters) for rejected and rfi events.',
      );
    }

    const merchant = await this.loadMerchant(dto.merchant_id);

    if (dto.event === 'approved') {
      if (!merchant.is_verified || !merchant.is_active) {
        throw new ConflictException(
          'Merchant is not approved yet (is_verified and is_active must both be true). Update the row first, then call notify.',
        );
      }
    }

    const platformName = this.config.get('platform.name', { infer: true });
    const customerWeb = this.config
      .get('platform.customerWebBaseUrl', { infer: true })
      .replace(/\/+$/, '');
    const portalBase = this.config
      .get('platform.merchantPortalBaseUrl', { infer: true })
      .replace(/\/+$/, '');
    const portalUrl =
      portalBase ||
      (customerWeb ? `${customerWeb}/auth/login` : 'https://foodstop.com.ng/auth/login');
    const storefrontUrl = customerWeb
      ? `${customerWeb}/restaurants/${merchant.slug}`
      : '';
    const applyUrl = customerWeb
      ? `${customerWeb}/become-a-vendor/register`
      : '';

    const ownerFirst =
      merchant.owner_full_name?.trim().split(/\s+/)[0] ?? 'there';

    const ownerLoginEmail = await this.resolveOwnerLoginEmail(merchant);

    let subject = '';
    let html = '';
    let sms = '';

    switch (dto.event) {
      case 'approved':
        subject = `Your ${platformName} store is approved`;
        html = this.htmlApproved({
          ownerFirst,
          businessName: merchant.business_name,
          applicationRef: merchant.application_reference,
          storefrontUrl,
          portalUrl,
          platformName,
        });
        sms = this.buildSmsApproved({
          ownerFirst,
          businessName: merchant.business_name,
          portalUrl,
          platformName,
        });
        await this.merchantNotifications.notify(merchant.id, {
          type: 'account_approved',
          title: 'Application approved',
          body: `Your store "${merchant.business_name}" is live. Log in to complete menu and hours.`,
          data: { storefront_url: storefrontUrl, portal_url: portalUrl },
        });
        break;
      case 'rejected':
        subject = `Update on your ${platformName} merchant application`;
        html = this.htmlRejected({
          ownerFirst,
          businessName: merchant.business_name,
          reason: dto.message!.trim(),
          applyUrl,
          platformName,
        });
        sms = this.smsRejected({
          ownerFirst,
          platformName,
          reasonSnippet: dto.message!.trim().slice(0, 120),
        });
        await this.merchantNotifications.notify(merchant.id, {
          type: 'application_rejected',
          title: 'Application not approved',
          body: dto.message!.trim(),
          data: {},
        });
        break;
      case 'rfi':
        subject = `${platformName} — more information needed`;
        html = this.htmlRfi({
          ownerFirst,
          businessName: merchant.business_name,
          note: dto.message!.trim(),
          applyUrl,
          platformName,
        });
        sms = this.smsRfi({
          ownerFirst,
          platformName,
          noteSnippet: dto.message!.trim().slice(0, 120),
        });
        await this.merchantNotifications.notify(merchant.id, {
          type: 'application_rfi',
          title: 'More information requested',
          body: dto.message!.trim(),
          data: {},
        });
        break;
      default:
        throw new BadRequestException('Unknown event');
    }

    const toEmail = ownerLoginEmail ?? merchant.business_email;
    const emailSent = await this.sendSendgridEmail(toEmail, subject, html);

    let smsSent = false;
    if (merchant.owner_phone && isValidNigerianMobile(merchant.owner_phone)) {
      const to234 = normalizeNigerianPhoneTo234(merchant.owner_phone);
      smsSent = await this.sendTermiiPlainSms(to234, sms);
    } else {
      this.logger.warn(
        `Skip SMS for merchant ${merchant.id}: invalid or missing owner_phone`,
      );
    }

    this.logger.log(
      `Application notify event=${dto.event} merchant=${merchant.id} email=${emailSent} sms=${smsSent}`,
    );

    return { ok: true, email_sent: emailSent, sms_sent: smsSent, in_app: true };
  }

  private async loadMerchant(id: string): Promise<MerchantRow> {
    const { data, error } = await this.supabase.db
      .from('merchants')
      .select(
        'id, user_id, business_name, slug, owner_full_name, owner_phone, business_email, application_reference, is_verified, is_active, is_suspended, suspension_reason, application_rfi_message',
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException(`Merchant ${id} not found`);
    }
    return data as MerchantRow;
  }

  private async resolveOwnerLoginEmail(
    merchant: MerchantRow,
  ): Promise<string | null> {
    if (!merchant.user_id) return null;
    const { data, error } = await this.supabase.db.auth.admin.getUserById(
      merchant.user_id,
    );
    if (error || !data?.user?.email) {
      this.logger.warn(
        `Could not resolve auth email for user ${merchant.user_id}: ${error?.message}`,
      );
      return null;
    }
    return data.user.email;
  }

  private htmlApproved(p: {
    ownerFirst: string;
    businessName: string;
    applicationRef: string | null;
    storefrontUrl: string;
    portalUrl: string;
    platformName: string;
  }): string {
    const ref = p.applicationRef
      ? `<p>Application reference: <strong>${this.esc(p.applicationRef)}</strong></p>`
      : '';
    const store = p.storefrontUrl
      ? `<p><a href="${this.esc(p.storefrontUrl)}">View your storefront</a></p>`
      : '';
    return `<p>Hi ${this.esc(p.ownerFirst)},</p>
<p>Your restaurant <strong>${this.esc(p.businessName)}</strong> has been approved and is now live on ${this.esc(p.platformName)}.</p>
${ref}
${store}
<p>Log in to your merchant account: <a href="${this.esc(p.portalUrl)}">${this.esc(p.portalUrl)}</a></p>
<p><strong>Next steps:</strong> complete your menu, delivery radius, and operating hours. ${this.esc(p.platformName)} deducts commission from each order&rsquo;s food subtotal; earnings appear in your wallet after delivery.</p>`;
  }

  private htmlRejected(p: {
    ownerFirst: string;
    businessName: string;
    reason: string;
    applyUrl: string;
    platformName: string;
  }): string {
    const reapply = p.applyUrl
      ? `<p>You may reapply here when ready: <a href="${this.esc(p.applyUrl)}">${this.esc(p.applyUrl)}</a></p>`
      : '';
    return `<p>Hi ${this.esc(p.ownerFirst)},</p>
<p>Thank you for applying to ${this.esc(p.platformName)}. We are unable to approve <strong>${this.esc(p.businessName)}</strong> at this time.</p>
<p><strong>Reason:</strong></p>
<pre style="white-space:pre-wrap;font-family:inherit;">${this.esc(p.reason)}</pre>
${reapply}`;
  }

  private htmlRfi(p: {
    ownerFirst: string;
    businessName: string;
    note: string;
    applyUrl: string;
    platformName: string;
  }): string {
    const link = p.applyUrl
      ? `<p>Reply by email or update your application: <a href="${this.esc(p.applyUrl)}">${this.esc(p.applyUrl)}</a></p>`
      : '';
    return `<p>Hi ${this.esc(p.ownerFirst)},</p>
<p>We need a bit more information to continue reviewing <strong>${this.esc(p.businessName)}</strong> on ${this.esc(p.platformName)}.</p>
<p><strong>Requested:</strong></p>
<pre style="white-space:pre-wrap;font-family:inherit;">${this.esc(p.note)}</pre>
${link}`;
  }

  private buildSmsApproved(p: {
    ownerFirst: string;
    businessName: string;
    portalUrl: string;
    platformName: string;
  }): string {
    const shortName =
      p.businessName.length > 40 ? `${p.businessName.slice(0, 37)}...` : p.businessName;
    const chunk = `${p.platformName}: Hi ${p.ownerFirst}, "${shortName}" is approved. Log in: ${p.portalUrl}`;
    return this.clipGsm(chunk, 480);
  }

  private smsRejected(p: {
    ownerFirst: string;
    platformName: string;
    reasonSnippet: string;
  }): string {
    return this.clipGsm(
      `${p.platformName}: Hi ${p.ownerFirst}, your merchant application was not approved. Check your email for details. ${p.reasonSnippet}`,
      480,
    );
  }

  private smsRfi(p: {
    ownerFirst: string;
    platformName: string;
    noteSnippet: string;
  }): string {
    return this.clipGsm(
      `${p.platformName}: Hi ${p.ownerFirst}, we need more info for your application. Check email. ${p.noteSnippet}`,
      480,
    );
  }

  private clipGsm(text: string, max: number): string {
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1)}…`;
  }

  private esc(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async sendSendgridEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<boolean> {
    const apiKey = this.config.get('sendgrid.apiKey', { infer: true });
    const fromEmail = this.config.get('sendgrid.fromEmail', { infer: true });
    const fromName = this.config.get('sendgrid.fromName', { infer: true });
    if (!apiKey || !fromEmail) {
      this.logger.warn('SendGrid not configured (SENDGRID_API_KEY / SENDGRID_FROM_EMAIL); skip email');
      return false;
    }
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName || 'Food Stop' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      this.logger.error(`SendGrid error ${res.status}: ${t}`);
      return false;
    }
    return true;
  }

  private async sendTermiiPlainSms(to234: string, sms: string): Promise<boolean> {
    const apiKey = this.config.get('termii.apiKey', { infer: true });
    if (!apiKey) {
      this.logger.warn('TERMII_API_KEY not set; skip SMS');
      return false;
    }
    const baseUrl = this.config.get('termii.baseUrl', { infer: true });
    const senderId = this.config.get('termii.senderId', { infer: true });
    const res = await fetch(`${baseUrl}/api/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        to: to234,
        from: senderId,
        sms,
        type: 'plain',
        channel: 'dnd',
      }),
    });
    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.error(`Termii SMS failed: ${JSON.stringify(json)}`);
      return false;
    }
    return true;
  }
}
