import React from 'react';

export default function FAQPage() {
  const faqs = [
    {
      question: "What are your delivery hours?",
      answer: "We are open for delivery from 10:00 AM to 10:00 PM, Monday to Sunday. On Fridays and Saturdays, we extend our delivery service until 11:00 PM."
    },
    {
      question: "How much does delivery cost?",
      answer: "Our standard delivery fee is a flat ₦1,500 within our delivery zones. Good news—all orders over ₦20,000 qualify for completely FREE delivery!"
    },
    {
      question: "How long will my order take?",
      answer: "We aim to deliver all meals piping hot within 30 to 45 minutes of confirming your order. Larger catering orders may take longer, and we will advise you upon confirmation."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We offer secure online payments through Paystack, which accepts all major Debit/Credit Cards, direct Bank Transfers, and USSD payments."
    },
    {
      question: "Can I cancel or change an active order?",
      answer: "Because we start preparing orders immediately to ensure quick delivery, we can only accept cancellations or modifications within 3 minutes of placing the order. Please call our support line urgently for changes."
    },
    {
      question: "Do you offer refunds?",
      answer: "We guarantee quality. If you receive the wrong item or there is a serious issue with your meal's preparation, please contact us within an hour of finding the issue, and we will issue a full refund to your wallet or original payment method."
    }
  ];

  return (
    <div className="container" style={{ padding: '6rem 0', minHeight: '80vh', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', marginBottom: '1rem', textAlign: 'center' }}>Frequently Asked Questions</h1>
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '3rem', fontSize: 'var(--text-lg)' }}>
        Everything you need to know about ordering from FOOD STOP.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {faqs.map((faq, index) => (
          <div key={index} style={{ padding: '1.5rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>{faq.question}</h3>
            <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{faq.answer}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: '1rem' }}>Still have questions?</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Our customer support team is just a WhatsApp message away.</p>
        <a href="/contact" className="btn btn-primary" style={{ display: 'inline-block' }}>Contact Support</a>
      </div>
    </div>
  );
}
