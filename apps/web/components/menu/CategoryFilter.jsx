'use client';
import { useRef } from 'react';

export default function CategoryFilter({ categories, activeCategory, onSelectCategory }) {
  const containerRef = useRef(null);
  
  return (
    <div className="category-filter" ref={containerRef}>
      <button 
        className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
        onClick={() => onSelectCategory('all')}
      >
        All Items
      </button>
      
      {categories.map((category) => (
        <button 
          key={category.id}
          className={`category-pill ${activeCategory === category.slug ? 'active' : ''}`}
          onClick={() => onSelectCategory(category.slug)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
