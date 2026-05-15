'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin, Clock, Award, Zap, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './home.css';
import MultiVendorHomeSections from '@/components/home/MultiVendorHomeSections';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export default function Home() {
  return (
    <div className="home-page">
      <FlashSaleBanner />
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <motion.div 
            className="hero-text"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.span 
              className="hero-badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Now open in Abuja & Port Harcourt
            </motion.span>
            <h1 className="hero-title">Experience the true taste of home.</h1>
            <p className="hero-subtitle">Premium authentic Nigerian dishes delivered fresh and hot to your doorstep.</p>
            <div className="hero-actions">
              <Link href="/restaurants" className="btn btn-primary">
                Order Now <ArrowRight size={18} />
              </Link>
              <Link href="/contact" className="btn btn-secondary">
                <MapPin size={18} /> Find a Location
              </Link>
            </div>
            
            <motion.div 
              className="order-type-selector"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button className="type-btn active">Delivery</button>
              <button className="type-btn">Pickup</button>
              <button className="type-btn">Dine-In</button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MultiVendorHomeSections />

      {/* Featured Categories */}
      <motion.section 
        className="featured-categories container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="section-header">
          <h2 className="section-title">Explore Our Menu</h2>
          <Link href="/menu" className="view-all">View full menu</Link>
        </div>
        <div className="category-grid">
          <motion.div variants={itemVariants} className="w-full">
            <Link href="/menu?category=rice" className="category-card">
              <div className="category-img" style={{ backgroundImage: "url('/images/menu/jollof-rice-party.png')" }}></div>
              <div className="category-info">
                <h3>Jollof Rice & Extras</h3>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants} className="w-full">
            <Link href="/menu?category=swallow" className="category-card">
              <div className="category-img" style={{ backgroundImage: "url('/images/menu/egusi-pounded-yam.png')" }}></div>
              <div className="category-info">
                <h3>Swallow & Soups</h3>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants} className="w-full">
            <Link href="/menu?category=grill" className="category-card">
              <div className="category-img" style={{ backgroundImage: "url('/images/menu/pepper-soup.jpg')" }}></div>
              <div className="category-info">
                <h3>Grilled & BBQ</h3>
              </div>
            </Link>
          </motion.div>
          <motion.div variants={itemVariants} className="w-full">
            <Link href="/menu?category=snacks" className="category-card">
              <div className="category-img" style={{ backgroundImage: "url('/images/brand/hero-bg.jpg')" }}></div>
              <div className="category-info">
                <h3>Small Chops & Snacks</h3>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Best Sellers Section */}
      <motion.section 
        className="best-sellers container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="section-header">
          <h2 className="section-title">Chef&apos;s Recommendations</h2>
          <span className="section-subtitle">Our most loved dishes this week</span>
        </div>
        <div className="sellers-grid">
            <motion.div className="seller-card" variants={itemVariants} whileHover={{ y: -10 }}>
              <div className="seller-img" style={{ backgroundImage: "url('/images/menu/jollof-rice-party.png')" }}>
                <span className="badge">Best Seller</span>
              </div>
              <div className="seller-content">
                <h3>Party Jollof Classic</h3>
                <p>Authentic smoky firewood-cooked rice served with chicken, moin-moin, and plantain.</p>
                <div className="seller-footer">
                   <span className="price">₦3,500</span>
                   <Link href="/menu/party-jollof-rice" className="btn btn-secondary-outline">Details</Link>
                </div>
              </div>
            </motion.div>
 
            <motion.div className="seller-card" variants={itemVariants} whileHover={{ y: -10 }}>
              <div className="seller-img" style={{ backgroundImage: "url('/images/menu/egusi-pounded-yam.png')" }}>
                <span className="badge">Popular</span>
              </div>
              <div className="seller-content">
                <h3>Pounded Yam & special Egusi</h3>
                <p>Smooth pounded yam with richly textured egusi soup, assorted meat and stockfish.</p>
                <div className="seller-footer">
                   <span className="price">₦4,200</span>
                   <Link href="/menu/pounded-yam-egusi" className="btn btn-secondary-outline">Details</Link>
                </div>
              </div>
            </motion.div>
 
            <motion.div className="seller-card" variants={itemVariants} whileHover={{ y: -10 }}>
              <div className="seller-img" style={{ backgroundImage: "url('/images/menu/pepper-soup.jpg')" }}>
                <span className="badge">Featured</span>
              </div>
              <div className="seller-content">
                <h3>Point-and-Kill Catfish</h3>
                <p>Spicy, aromatic and fresh catfish in our secret blend of local Nigerian spices.</p>
                <div className="seller-footer">
                   <span className="price">₦5,500</span>
                   <Link href="/menu/catfish-pepper-soup" className="btn btn-secondary-outline">Details</Link>
                </div>
              </div>
            </motion.div>
        </div>
      </motion.section>

      {/* Authentic Experience Section */}
      <section className="authentic-experience container" style={{ paddingTop: 'var(--space-16)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-8)', alignItems: 'center' }}>
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Experience True Naija Hospitality</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Step into FOOD STOP and immerse yourself in a vibrant, premium dining atmosphere. Our master chefs prepare every dish with passion, using traditional recipes and the freshest ingredients to bring you the authentic taste of home.
            </p>
            <Link href="/about" className="btn btn-primary-outline" style={{ border: '2px solid var(--color-primary)', color: 'var(--color-primary)', fontWeight: '600', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
              Our Story
            </Link>
          </motion.div>
          
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '300px', position: 'relative', marginTop: '2rem' }}>
              <Image src="/images/brand/restaurant_setup.png" alt="Premium Nigerian Restaurant" fill style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: '300px', position: 'relative', marginBottom: '2rem' }}>
              <Image src="/images/brand/chef_cooking.png" alt="Chef cooking Jollof Rice" fill style={{ objectFit: 'cover' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Catering Section */}
      <section className="catering-preview">
        <div className="container">
          <div className="catering-card">
            <div className="catering-text">
              <motion.span 
                className="section-badge"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
              >
                EVENTS & CORPORATE
              </motion.span>
              <h2>Premium Catering for your Big Events</h2>
              <p>From corporate lunches to weddings and traditional ceremonies, we bring the firewood-smoky flavor to your doorstep. Custom menus, professional service, and authentic taste.</p>
              <div className="catering-features">
                 <div className="feat">
                    <CheckCircle2 size={16} color="var(--color-primary)" />
                    <span>Custom Menu Builder</span>
                 </div>
                 <div className="feat">
                    <CheckCircle2 size={16} color="var(--color-primary)" />
                    <span>Professional Servers</span>
                 </div>
                 <div className="feat">
                    <CheckCircle2 size={16} color="var(--color-primary)" />
                    <span>Bulk Discounts</span>
                 </div>
              </div>
              <Link href="/catering" className="btn btn-primary">Get a Catering Quote</Link>
            </div>
            <div className="catering-image" style={{ backgroundImage: "url('/images/brand/catering_setup.jpg')" }}>
               <div className="floating-badge">
                  <strong>10k+</strong>
                  <span>Guests Served</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog/Story Section */}
      <section className="blog-preview container">
        <div className="section-header">
           <h2 className="section-title">Latest from the Kitchen</h2>
           <Link href="/story" className="view-all">Read our stories</Link>
        </div>
        <div className="blog-grid">
           {[
             { title: 'The Secret to the Perfect Smoky Jollof', date: 'May 12, 2026', img: '/images/menu/jollof-rice-party.png' },
             { title: '5 Authentic Nigerian Soups you must try', date: 'May 10, 2026', img: '/images/menu/egusi-pounded-yam.png' },
             { title: 'Behind the Scenes: Sourcing our Farm-Fresh Pepper', date: 'May 08, 2026', img: '/images/brand/chef_cooking.png' }
           ].map((post, i) => (
             <motion.div key={i} className="blog-card" variants={itemVariants} whileHover={{ y: -5 }}>
                <div className="blog-img" style={{ backgroundImage: `url('${post.img}')` }}></div>
                <div className="blog-content">
                   <span className="blog-date">{post.date}</span>
                   <h3>{post.title}</h3>
                   <Link href="/story" className="read-more">Read More <ArrowRight size={14} /></Link>
                </div>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-us">
        <div className="container">
          <motion.div 
            className="stats-row"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <motion.div className="stat-item" variants={itemVariants}>
              <Clock size={40} className="stat-icon" />
              <div className="stat-text">
                <h4>30 Min Delivery</h4>
                <p>From kitchen to your door while still steaming hot.</p>
              </div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <Award size={40} className="stat-icon" />
              <div className="stat-text">
                <h4>Premium Quality</h4>
                <p>Only the freshest ingredients from our local farms.</p>
              </div>
            </motion.div>
            <motion.div className="stat-item" variants={itemVariants}>
              <Zap size={40} className="stat-icon" />
              <div className="stat-text">
                <h4>Easy Ordering</h4>
                <p>Quick checkout and real-time order tracking.</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* App Promo Banner */}
      <section className="app-promo container">
        <motion.div 
          className="app-promo-card"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="app-promo-text">
            <h2>Taste, Simplified.<br />Get the App Today.</h2>
            <p>Order your favorite meals even faster with the FOOD STOP mobile app. Available on iOS and Android.</p>
            <div className="app-badges">
               <button className="app-btn"><Smartphone size={20} /> App Store</button>
               <button className="app-btn"><Smartphone size={20} /> Play Store</button>
            </div>
          </div>
          <motion.div 
            className="app-promo-visual"
            initial={{ rotate: -10, y: 30 }}
            whileInView={{ rotate: 0, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
             <div className="mockup-placeholder">
                <Smartphone size={100} color="var(--color-primary)" opacity={0.2} />
             </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
