'use client';
import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  MapPin, 
  ChefHat, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CateringPage() {
  const [guestCount, setGuestCount] = useState(50);
  const [step, setStep] = useState(1);

  const packages = [
    { title: 'Office Lunch', min: 10, price: '₦3,500/head', features: ['Individual packaging', 'Choice of 2 proteins', 'Standard sides'] },
    { title: 'Social Party', min: 50, price: '₦5,500/head', features: ['Buffet style', 'Wait staff included', 'Dessert platter'] },
    { title: 'Wedding Elite', min: 100, price: '₦8,500/head', features: ['Full service', 'Mocktail bar', 'Custom menu design'] },
  ];

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingTop: '80px' }}>
      {/* Catering Hero */}
      <section style={{ backgroundColor: '#000', color: 'white', padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.4, backgroundImage: "url('/images/brand/catering_setup.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 2 }}>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{ fontSize: '4rem', fontWeight: '800', marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}
          >
            Big Event?<br /><span style={{ color: 'var(--color-primary)' }}>Big Flavour.</span>
          </motion.h1>
          <p style={{ fontSize: '1.25rem', maxWidth: '600px', color: '#cbd5e1', marginBottom: '2.5rem' }}>
            Elevate your event with authentic Nigerian catering. From corporate boardrooms to wedding ballrooms, we deliver the taste of home at scale.
          </p>
          <button onClick={() => document.getElementById('quote-form').scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary">Start Planning</button>
        </div>
      </section>

      {/* Package Selection */}
      <section style={{ padding: '80px 0', backgroundColor: '#fafafa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
           <h2 style={{ fontSize: '2.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '4rem' }}>Choose your Experience</h2>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              {packages.map((pkg, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  style={{ backgroundColor: 'white', padding: '2.5rem', borderRadius: '32px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid #f1f5f9' }}
                >
                   <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>{pkg.title}</h3>
                   <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '1.5rem' }}>{pkg.price}</div>
                   <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem' }}>
                      {pkg.features.map((feat, j) => (
                        <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem', color: '#64748b' }}>
                           <CheckCircle2 size={16} color="var(--color-primary)" />
                           {feat}
                        </li>
                      ))}
                   </ul>
                   <button className="btn btn-secondary-outline" style={{ width: '100%' }}>Select Package</button>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Custom Quote Builder */}
      <section id="quote-form" style={{ padding: '100px 0' }}>
         <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '40px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', border: '1px solid #f1f5f9' }}>
               <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '2rem' }}>Request a Catering Quote</h2>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Step 1: Basics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                           <label style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Full Name</label>
                           <input type="text" placeholder="e.g. Tunde Balogun" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </div>
                        <div>
                           <label style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Event Date</label>
                           <input type="date" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        </div>
                     </div>

                     <div>
                        <label style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '1rem', display: 'block' }}>Estimated Guest Count: <span style={{ color: 'var(--color-primary)' }}>{guestCount}</span></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                           <button onClick={() => setGuestCount(Math.max(10, guestCount - 10))} style={{ padding: '0.5rem', borderRadius: '50%', border: '1px solid #e2e8f0', cursor: 'pointer' }}><Minus size={18} /></button>
                           <input 
                             type="range" 
                             min="10" 
                             max="1000" 
                             step="10" 
                             value={guestCount} 
                             onChange={(e) => setGuestCount(parseInt(e.target.value))}
                             style={{ flex: 1, accentColor: 'var(--color-primary)' }} 
                           />
                           <button onClick={() => setGuestCount(guestCount + 10)} style={{ padding: '0.5rem', borderRadius: '50%', border: '1px solid #e2e8f0', cursor: 'pointer' }}><Plus size={18} /></button>
                        </div>
                     </div>

                     <div>
                        <label style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', display: 'block' }}>Menu Selection</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                           {['Rice Platter', 'Swallow Feast', 'Suya Platter', 'Small Chops Mix'].map((item) => (
                             <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                <input type="checkbox" style={{ accentColor: 'var(--color-primary)' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{item}</span>
                             </label>
                           ))}
                        </div>
                     </div>

                     <button 
                       className="btn btn-primary" 
                       style={{ width: '100%', padding: '1.25rem', fontSize: '1.125rem' }}
                       onClick={() => alert('Quote Request Sent! Our catering manager will contact you shortly.')}
                     >
                       Submit Request
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
