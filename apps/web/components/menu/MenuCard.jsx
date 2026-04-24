import { Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { toast } from 'react-hot-toast';

export default function MenuCard({ item }) {
  const { addItem } = useCart();
  
  // Fallback image if none provided
  const imageUrl = item.image_url || '/images/brand/hero-bg.jpg';
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(item);
  };

  return (
    <Link href={`/menu/${item.slug}`} className="menu-card-link">
      <div className="menu-card">
        <div className="menu-card-image-wrapper">
          <Image 
            src={imageUrl} 
            alt={item.name} 
            fill
            className="menu-card-image"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        
        <div className="menu-card-body">
          <div className="menu-card-header">
            <h3 className="menu-card-title">{item.name}</h3>
            <div className="menu-card-price">₦{item.price.toLocaleString()}</div>
          </div>
          
          <p className="menu-card-desc">{item.description}</p>
          
          <div className="menu-card-footer">
            <div className="dietary-tags">
              {item.dietary_tags?.map(tag => (
                <span key={tag} className={`dietary-tag tag-${tag.toLowerCase()}`}>
                  {tag}
                </span>
              ))}
            </div>
            
            <button 
              className="add-btn" 
              aria-label={`Add ${item.name} to cart`}
              onClick={handleAddToCart}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
