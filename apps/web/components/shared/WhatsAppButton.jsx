'use client';
import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function WhatsAppButton({ phoneNumber = '2349133449270', message = "Hi FOOD STOP, I'd like to make an inquiry." }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slight delay so it doesn't pop in immediately
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a 
      href={whatsappUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="whatsapp-float-btn"
    >
      <MessageCircle size={32} />
      <style jsx>{`
        .whatsapp-float-btn {
          position: fixed;
          bottom: 24px;
          left: 24px;
          background-color: #25D366;
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.4);
          z-index: 999;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .whatsapp-float-btn:hover {
          transform: scale(1.1);
        }
        @media (max-width: 768px) {
          .whatsapp-float-btn {
            bottom: calc(var(--mobile-nav-height) + 16px);
          }
        }
      `}</style>
    </a>
  );
}
