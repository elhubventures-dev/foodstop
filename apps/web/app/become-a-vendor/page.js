import Link from 'next/link';
import './become-a-vendor.css';

export const metadata = {
  title: 'Become a vendor | FOOD STOP',
  description: 'Partner with FOOD STOP and reach customers across Abuja and Port Harcourt.',
};

export default function BecomeAVendorPage() {
  return (
    <div className="vendor-landing">
      <h1>Become a vendor</h1>
      <p>
        List your restaurant on FOOD STOP, manage orders through our marketplace stack, and get
        paid on our commission model. Complete the guided registration — you will need business
        details, owner verification (OTP to your phone), document URLs (upload to Cloudinary
        first), and a Nigerian bank account we can verify with Paystack.
      </p>
      <p>
        After you submit, our team reviews your application. You will receive access to the
        merchant portal once approved.
      </p>
      <div className="vendor-cta-row">
        <Link href="/become-a-vendor/register" className="vendor-btn-primary">
          Start registration
        </Link>
        <Link href="/contact" className="vendor-btn-secondary">
          Talk to us first
        </Link>
      </div>
    </div>
  );
}
