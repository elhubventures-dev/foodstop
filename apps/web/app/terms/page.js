import React from 'react';

export default function TermsPage() {
  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ padding: '3rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-md)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', marginBottom: '2rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1rem', display: 'inline-block' }}>
          Terms & Conditions
        </h1>
        
        <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: 'var(--text-base)' }}>
          <p>
            Welcome to FOOD STOP. These terms and conditions outline the rules and regulations for the use of FOOD STOP&apos;s Website and Mobile Application.
            By accessing this app, we assume you accept these terms completely. Do not continue to use our platform if you do not agree to all of the terms and conditions stated on this page.
          </p>

          <section style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>1. Ordering & Payment</h3>
            <p>
              When you place an order with FOOD STOP, you guarantee that all details provided are accurate and complete. 
              All payments must be completed via our designated secure payment gateway (Paystack) prior to delivery mapping. 
              Prices are subject to change without notice, though any order successfully checked out will honor the price displayed at purchase.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>2. Delivery Terms</h3>
            <p>
              We strive to deliver orders within the estimated time frame of 30-45 minutes. However, external factors such as severe weather, 
              intense traffic, or logistical blockages may arise. In such instances, we will communicate delays to the contact number provided.
              You must ensure someone is available to receive the delivery at the mapped address. Wait times exceeding 10 minutes upon driver arrival may attract cancellation without full refund.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>3. Cancellations & Modifications</h3>
            <p>
              Orders are immediately pushed to our kitchen to maintain our fast delivery speeds. Orders can only be modified 
              or canceled by calling our support line within 3 minutes of successful payment. Cancellations after this window 
              will incur a 100% material fee deduction.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>4. Intellectual Property</h3>
            <p>
              Unless otherwise stated, FOOD STOP and/or its licensors own the intellectual property rights for all software, imagery, branding, and text materials 
              deployed on this platform. You may not reproduce, duplicate, copy, or redistribute any of our materials for commercial purposes.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>5. User Accounts</h3>
            <p>
              By creating an account, you ensure your email and phone details denote you. Account data is heavily secured via Supabase auth, but keeping your login credentials confidential remains your responsibility. We reserve the right to suspend accounts committing fraudulent orders.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
