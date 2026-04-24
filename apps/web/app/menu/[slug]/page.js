'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Minus, ShoppingBag, ArrowLeft, Clock, Flame, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { MOCK_ITEMS } from '@/lib/mockData';
import MenuCard from '@/components/menu/MenuCard';


export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const supabase = useMemo(() => createClient(), []);
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('regular'); // Fallback logic

  useEffect(() => {
    async function fetchItem() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*, categories(*)')
          .eq('slug', slug)
          .single();

        if (error) {
          const mockItem = MOCK_ITEMS.find((mock) => mock.slug === slug);
          if (mockItem) {
            setItem(mockItem);
            return;
          }
          throw error;
        }
        setItem(data);
      } catch (err) {
        console.error('Error fetching item:', err);
        toast.error('Item not found');
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchItem();
  }, [slug, supabase]);

  // All hooks must be called before any early returns (Rules of Hooks)
  const recommendations = React.useMemo(() => {
    if (!item) return [];
    const sameCategory = MOCK_ITEMS.filter(i => i.category_slug === item.category_slug && i.slug !== item.slug);
    const otherCategory = MOCK_ITEMS.filter(i => i.category_slug !== item.category_slug && i.slug !== item.slug);
    return [...sameCategory, ...otherCategory].slice(0, 4);
  }, [item]);

  if (loading) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Loading...</div>;
  if (!item) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Item not found.</div>;

  const handleAddToCart = () => {
    addItem({ ...item, quantity, subtotal: item?.price ? item.price * quantity : 0 });
  };
  
  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="product-detail-page container" style={{ padding: '6rem 0' }}>
      <button 
        onClick={() => router.back()} 
        className="back-btn" 
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--color-primary)', fontWeight: '600' }}
      >
        <ArrowLeft size={20} /> Back to Menu
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem' }}>
        {/* Image Section */}
        <div style={{ position: 'relative', height: '500px', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
          <Image 
            src={item.image_url || '/images/brand/hero-bg.jpg'} 
            alt={item.name}
            fill
            style={{ objectFit: 'cover' }}
          />
        </div>

        {/* Info Section */}
        <div className="product-info">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {item.is_new && <span className="badge badge-new" style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: '700' }}>NEW</span>}
            {item.is_featured && <span className="badge badge-featured" style={{ backgroundColor: 'gold', color: 'black', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: '700' }}>FEATURED</span>}
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-4xl)', marginBottom: '1rem' }}>{item.name}</h1>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--color-primary)', marginBottom: '2rem' }}>₦{item.price.toLocaleString()}</p>
          
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)', lineHeight: '1.7', marginBottom: '2.5rem' }}>
            {item.description}
          </p>

          <div style={{ display: 'flex', gap: '2.5rem', marginBottom: '3rem', color: 'var(--color-text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} />
              <span>{item.preparation_time || 25} mins</span>
            </div>
            {item.spice_level > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={20} color="var(--color-primary)" />
                <span>Spice Level: {item.spice_level}/5</span>
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid var(--color-bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '0.5rem' }}>
              <button onClick={decrementQty} style={{ padding: '0.5rem', color: 'var(--color-text-secondary)' }}><Minus size={20} /></button>
              <span style={{ padding: '0 1.5rem', fontSize: 'var(--text-xl)', fontWeight: '600' }}>{quantity}</span>
              <button onClick={incrementQty} style={{ padding: '0.5rem', color: 'var(--color-primary)' }}><Plus size={20} /></button>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ padding: '1rem 2rem', fontSize: 'var(--text-lg)', flex: 1 }}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={22} style={{ marginRight: '0.5rem' }} /> Add
            </button>
            <button 
              className="btn btn-secondary-outline" 
              style={{ padding: '1rem 2rem', fontSize: 'var(--text-lg)', flex: 1 }}
              onClick={handleBuyNow}
            >
              <CreditCard size={22} style={{ marginRight: '0.5rem' }} /> Buy Now
            </button>
          </div>

          <div style={{ marginTop: '3rem' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Dietary Info</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {item.dietary_tags?.length > 0 ? item.dietary_tags.map(tag => (
                <span key={tag} style={{ backgroundColor: 'var(--color-bg-tertiary)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>
                  {tag}
                </span>
              )) : <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Standard ingredients. Contact us for specifics.</span>}
            </div>
          </div>

          {/* Serving & Nutritional Info */}
          {(item.serves || item.calories) && (
            <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              {item.serves && (
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', flex: '1', minWidth: '140px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Serves</div>
                  <div style={{ fontWeight: '600' }}>{item.serves}</div>
                </div>
              )}
              {item.calories && (
                <div style={{ backgroundColor: 'var(--color-bg-secondary)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', flex: '1', minWidth: '140px' }}>
                  <div style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', fontWeight: '700', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Calories</div>
                  <div style={{ fontWeight: '600' }}>{item.calories}</div>
                </div>
              )}
            </div>
          )}

          {/* Ingredients */}
          {item.ingredients && item.ingredients.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Key Ingredients</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {item.ingredients.map(ing => (
                  <span key={ing} style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)' }}>
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginTop: '6rem', paddingTop: '3rem', borderTop: '1px solid var(--color-border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', marginBottom: '0.75rem', textAlign: 'center' }}>You Might Also Like</h2>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>Popular dishes to complete your order.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
              {recommendations.map(rec => (
                <MenuCard key={rec.id} item={rec} />
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
