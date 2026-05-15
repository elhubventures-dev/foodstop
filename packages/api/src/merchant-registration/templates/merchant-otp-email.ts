/**
 * HTML + plain text for merchant registration OTP (Resend).
 * Inline styles only — table layout for broad email client support.
 */

export type MerchantOtpEmailParams = {
  platformName: string;
  code: string;
  customerWebBaseUrl: string;
  supportEmail: string;
  /** Optional absolute https URL to a logo image */
  emailLogoUrl: string;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isHttpsUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Brand tokens aligned with Food Stop web/admin (primary orange, slate neutrals). */
const C = {
  primary: '#ea580c',
  primaryDark: '#c2410c',
  ink: '#0f172a',
  muted: '#64748b',
  paper: '#ffffff',
  wash: '#f8fafc',
  border: '#e2e8f0',
  footerText: '#94a3b8',
} as const;

export function buildMerchantOtpEmailHtml(p: MerchantOtpEmailParams): string {
  const name = escapeHtml(p.platformName.trim() || 'Food Stop');
  const code = escapeHtml((p.code ?? '').trim());
  const web = p.customerWebBaseUrl.replace(/\/+$/, '');
  const support = p.supportEmail.trim();
  const logoUrl = p.emailLogoUrl.trim();

  const logoBlock = isHttpsUrl(logoUrl)
    ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" width="168" height="auto" border="0" style="display:block;margin:0 auto;max-height:56px;width:auto;height:auto;" />`
    : `<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto;">
  <tr>
    <td style="width:48px;height:48px;background:${C.paper};border-radius:12px;text-align:center;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-weight:800;font-size:20px;color:${C.primary};line-height:48px;">FS</td>
    <td style="padding-left:14px;text-align:left;vertical-align:middle;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${name}</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.9);margin-top:4px;text-transform:uppercase;letter-spacing:0.1em;">Merchant verification</div>
    </td>
  </tr>
</table>`;

  const codeSpaced = [...code].join('&#8201;');

  const links: string[] = [];
  if (web) {
    links.push(
      `<a href="${escapeHtml(web)}" style="color:${C.primary};text-decoration:none;font-weight:600;">Website</a>`,
    );
  }
  if (support) {
    links.push(
      `<a href="mailto:${escapeHtml(support)}" style="color:${C.muted};text-decoration:none;">Support</a>`,
    );
  }
  const footerMid =
    links.length > 0
      ? links.join(`<span style="color:${C.border};padding:0 12px;">|</span>`)
      : `<span style="color:${C.footerText};">${name}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name} - verification code</title>
</head>
<body style="margin:0;padding:0;background-color:${C.wash};font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${C.wash};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:${C.paper};border-radius:16px;overflow:hidden;border:1px solid ${C.border};box-shadow:0 10px 40px rgba(15,23,42,0.08);">
          <tr>
            <td bgcolor="${C.primary}" style="background-color:${C.primary};background-image:linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%);padding:28px 24px;text-align:center;">
              ${logoBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 12px;">
              <p style="margin:0;font-size:16px;color:${C.ink};line-height:1.5;font-weight:600;">Verify your email</p>
              <p style="margin:14px 0 0;font-size:15px;color:${C.muted};line-height:1.65;">
                Use the code below to continue your <strong style="color:${C.ink};">${name}</strong> merchant application.
                It expires in <strong style="color:${C.ink};">10 minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="background:#fff7ed;border:2px dashed #fdba74;border-radius:14px;">
                <tr>
                  <td style="padding:22px 28px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:0.12em;color:${C.ink};">
                    ${codeSpaced}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <p style="margin:0;font-size:13px;color:${C.muted};line-height:1.55;text-align:center;">
                Do not share this code with anyone. ${name} will never ask for your code by phone or unsolicited email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background:${C.wash};border-top:1px solid ${C.border};text-align:center;font-size:12px;color:${C.footerText};line-height:1.6;">
              ${footerMid}
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:11px;color:${C.footerText};text-align:center;max-width:480px;line-height:1.5;">
          You received this because someone requested a merchant signup code for this address.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildMerchantOtpEmailText(p: MerchantOtpEmailParams): string {
  const name = p.platformName.trim() || 'Food Stop';
  const code = (p.code ?? '').trim();
  const lines = [
    `${name} - merchant verification`,
    '',
    `Your code: ${code}`,
    '',
    'This code expires in 10 minutes. Do not share it with anyone.',
    `${name} will never ask for your code by phone or unsolicited email.`,
    '',
  ];
  const web = p.customerWebBaseUrl.replace(/\/+$/, '');
  if (web) lines.push(`Website: ${web}`);
  if (p.supportEmail.trim()) lines.push(`Support: ${p.supportEmail.trim()}`);
  return lines.join('\n');
}
