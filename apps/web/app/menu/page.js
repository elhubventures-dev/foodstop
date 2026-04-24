'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import MenuCard from '@/components/menu/MenuCard';
import CategoryFilter from '@/components/menu/CategoryFilter';
import './menu.css';

import { MOCK_CATEGORIES, MOCK_ITEMS } from '@/lib/mockData';

export default function MenuPage() {
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [items, setItems] = useState(MOCK_ITEMS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      try {
        const { data: cats, error: catsError } = await supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order');
          
        const { data: menuItems, error: itemsError } = await supabase
          .from('menu_items')
          .select('*, categories(name, slug)')
          .eq('is_available', true)
          .order('display_order');
          
        if (cats && cats.length > 0 && !catsError) {
          setCategories(cats);
        }
        
        if (menuItems && menuItems.length > 0 && !itemsError) {
          // Normalize the category_slug for filtering
          const normalizedItems = menuItems.map(item => ({
            ...item,
            category_slug: item.categories?.slug
          }));
          setItems(normalizedItems);
        }
      } catch (err) {
        console.error('Failed to fetch menu, using fallbacks', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchMenu();
  }, [supabase]);

  // Filter items based on active category and search query
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCategory = activeCategory === 'all' || item.category_slug === activeCategory;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [items, activeCategory, searchQuery]);

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <div className="container">
          <h1 className="menu-hero-title">Our Menu</h1>
          <p className="menu-hero-subtitle">
            Explore our wide variety of authentic Nigerian dishes, prepared fresh to order.
          </p>
        </div>
      </section>

      <div className="container menu-container">
        {/* Search and Filters */}
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search for dishes, ingredients..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1rem 1rem 3rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontSize: 'var(--text-base)',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        </div>

        <CategoryFilter 
          categories={categories} 
          activeCategory={activeCategory} 
          onSelectCategory={setActiveCategory} 
        />

        {/* Menu Grid */}
        <div className="menu-grid" style={{ marginTop: '2rem' }}>
          {loading ? (
            // Skeleton loaders could go here
            <p>Loading the menu...</p>
          ) : filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <MenuCard key={item.id} item={item} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
              <h3>No items found</h3>
              <p>Try adjusting your search or category filter.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
