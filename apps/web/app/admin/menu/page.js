'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MOCK_ITEMS, MOCK_CATEGORIES } from '@/lib/mockData';
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_ITEM = {
  name: '',
  slug: '',
  description: '',
  price: '',
  category_slug: '',
  preparation_time: '',
  spice_level: 0,
  serves: '',
  calories: '',
  image_url: '',
  dietary_tags: [],
  ingredients: [],
  is_available: true,
  is_featured: false,
};

const EMPTY_CATEGORY = {
  name: '',
  slug: '',
};

export default function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('items');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ITEM);
  const [catFormData, setCatFormData] = useState(EMPTY_CATEGORY);
  const [tagInput, setTagInput] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Try Supabase first
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order');

      const { data: itemData, error: itemError } = await supabase
        .from('menu_items')
        .select('*, categories:category_id (name, slug)')
        .order('display_order');

      if (catData && catData.length > 0 && !catError) {
        setCategories(catData);
      } else {
        setCategories(MOCK_CATEGORIES);
      }

      if (itemData && itemData.length > 0 && !itemError) {
        const normalized = itemData.map(item => ({
          ...item,
          category_slug: item.categories?.slug,
          category_name: item.categories?.name,
        }));
        setItems(normalized);
      } else {
        // Use mock data with category names injected
        const withCatNames = MOCK_ITEMS.map(item => {
          const cat = MOCK_CATEGORIES.find(c => c.slug === item.category_slug);
          return { ...item, category_name: cat?.name || 'Uncategorized', is_available: item.is_available !== false };
        });
        setItems(withCatNames);
      }
    } catch (err) {
      console.error('Error fetching data, using mock:', err);
      setCategories(MOCK_CATEGORIES);
      const withCatNames = MOCK_ITEMS.map(item => {
        const cat = MOCK_CATEGORIES.find(c => c.slug === item.category_slug);
        return { ...item, category_name: cat?.name || 'Uncategorized', is_available: item.is_available !== false };
      });
      setItems(withCatNames);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Item CRUD ---
  const openAddItem = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_ITEM, category_slug: categories[0]?.slug || '' });
    setTagInput('');
    setIngredientInput('');
    setShowModal('item');
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      price: item.price || '',
      category_slug: item.category_slug || '',
      preparation_time: item.preparation_time || '',
      spice_level: item.spice_level || 0,
      serves: item.serves || '',
      calories: item.calories || '',
      image_url: item.image_url || '',
      dietary_tags: item.dietary_tags || [],
      ingredients: item.ingredients || [],
      is_available: item.is_available !== false,
      is_featured: item.is_featured || false,
    });
    setTagInput('');
    setIngredientInput('');
    setShowModal('item');
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleItemChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !editingItem) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.dietary_tags.includes(tag)) {
      setFormData(prev => ({ ...prev, dietary_tags: [...prev.dietary_tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, dietary_tags: prev.dietary_tags.filter(t => t !== tag) }));
  };

  const addIngredient = () => {
    const ing = ingredientInput.trim();
    if (ing && !formData.ingredients.includes(ing)) {
      setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, ing] }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (ing) => {
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i !== ing) }));
  };

  const saveItem = async () => {
    if (!formData.name || !formData.price || !formData.category_slug) {
      toast.error('Name, price and category are required');
      return;
    }

    const itemSaveToast = toast.loading(editingItem ? 'Updating item...' : 'Adding item...');
    
    try {
      const cat = categories.find(c => c.slug === formData.category_slug);
      if (!cat) throw new Error('Selected category not found');

      const itemData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        price: Number(formData.price),
        category_id: cat.id,
        preparation_time: Number(formData.preparation_time) || 0,
        spice_level: Number(formData.spice_level) || 0,
        serves: formData.serves,
        calories: formData.calories,
        image_url: formData.image_url,
        dietary_tags: formData.dietary_tags,
        ingredients: formData.ingredients,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (editingItem) {
        result = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id)
          .select();
      } else {
        result = await supabase
          .from('menu_items')
          .insert([itemData])
          .select();
      }

      if (result.error) throw result.error;

      toast.success(editingItem ? 'Item updated' : 'Item added', { id: itemSaveToast });
      setShowModal(false);
      fetchData(); // Refresh list from server
    } catch (err) {
      console.error('Error saving item:', err);
      toast.error(`Error: ${err.message}`, { id: itemSaveToast });
    }
  };

  const deleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const deleteToast = toast.loading('Deleting item...');
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setItems(prev => prev.filter(it => it.id !== itemId));
      toast.success('Item deleted', { id: deleteToast });
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: deleteToast });
    }
  };

  const toggleAvailability = async (item) => {
    const newStatus = !item.is_available;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: newStatus })
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, is_available: newStatus } : it));
      toast.success(newStatus ? 'Item is now available' : 'Item marked as sold out');
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // --- Category CRUD ---
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatFormData({ ...EMPTY_CATEGORY });
    setShowModal('category');
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatFormData({ name: cat.name, slug: cat.slug });
    setShowModal('category');
  };

  const handleCatChange = (field, value) => {
    setCatFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && !editingCategory) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const saveCategory = async () => {
    if (!catFormData.name) {
      toast.error('Category name is required');
      return;
    }

    const catSaveToast = toast.loading(editingCategory ? 'Updating category...' : 'Adding category...');
    
    try {
      const catData = {
        name: catFormData.name,
        slug: catFormData.slug || generateSlug(catFormData.name),
      };

      let result;
      if (editingCategory) {
        result = await supabase
          .from('categories')
          .update(catData)
          .eq('id', editingCategory.id)
          .select();
      } else {
        result = await supabase
          .from('categories')
          .insert([catData])
          .select();
      }

      if (result.error) throw result.error;

      toast.success(editingCategory ? 'Category updated' : 'Category added', { id: catSaveToast });
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: catSaveToast });
    }
  };

  const deleteCategory = async (catId) => {
    if (!confirm('Delete this category? Items in this category will become uncategorized.')) return;
    
    const deleteToast = toast.loading('Deleting category...');
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', catId);

      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== catId));
      toast.success('Category deleted', { id: deleteToast });
    } catch (err) {
      toast.error(`Error: ${err.message}`, { id: deleteToast });
    }
  };

  // --- Styles ---
  const modalOverlayStyle = {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const modalStyle = {
    backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
    width: '90%', maxWidth: '640px', maxHeight: '85vh', overflow: 'auto',
    padding: '2rem', boxShadow: 'var(--shadow-xl)',
  };
  const fieldStyle = { marginBottom: '1.25rem' };
  const labelStyle = { display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' };
  const inputStyle = {
    width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
    fontSize: 'var(--text-base)',
  };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const pillStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    backgroundColor: 'var(--color-bg-tertiary)', padding: '0.3rem 0.75rem',
    borderRadius: 'var(--radius-full)', fontSize: 'var(--text-sm)',
  };

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Menu Management</h1>
        <button className="btn btn-primary" onClick={activeView === 'items' ? openAddItem : openAddCategory}>
          <Plus size={18} /> Add {activeView === 'items' ? 'Item' : 'Category'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeView === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('items')}
        >
          Menu Items ({items.length})
        </button>
        <button
          className={`btn ${activeView === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveView('categories')}
        >
          Categories ({categories.length})
        </button>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
          </div>
        ) : activeView === 'items' ? (
          items.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <p>No menu items yet.</p>
              <button className="btn btn-primary" onClick={openAddItem} style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Add Your First Item
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>
                      {item.name}
                      {item.is_featured && <span style={{ marginLeft: 8, backgroundColor: 'gold', color: '#333', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, verticalAlign: 'middle' }}>FEATURED</span>}
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{item.category_name || 'Uncategorized'}</td>
                    <td>{'\u20A6'}{Number(item.price).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => toggleAvailability(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: item.is_available ? 'var(--color-success)' : 'var(--color-error)' }}
                      >
                        {item.is_available ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {item.is_available ? 'Available' : 'Sold Out'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => openEditItem(item)}><Edit size={16} /></button>
                        <button className="btn btn-secondary" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => deleteItem(item.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          categories.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <p>No categories yet.</p>
              <button className="btn btn-primary" onClick={openAddCategory} style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Add Your First Category
              </button>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Items Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{cat.slug}</td>
                    <td>{items.filter(i => i.category_slug === cat.slug).length}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px' }} onClick={() => openEditCategory(cat)}><Edit size={16} /></button>
                        <button className="btn btn-secondary" style={{ padding: '4px', color: 'var(--color-error)' }} onClick={() => deleteCategory(cat.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* ===== ITEM MODAL ===== */}
      {showModal === 'item' && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} value={formData.name} onChange={e => handleItemChange('name', e.target.value)} placeholder="e.g. Party Jollof Rice" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Slug</label>
              <input style={inputStyle} value={formData.slug} onChange={e => handleItemChange('slug', e.target.value)} placeholder="auto-generated-from-name" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Price (NGN) *</label>
                <input style={inputStyle} type="number" value={formData.price} onChange={e => handleItemChange('price', e.target.value)} placeholder="3500" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Category</label>
                <select style={selectStyle} value={formData.category_slug} onChange={e => handleItemChange('category_slug', e.target.value)}>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={formData.description} onChange={e => handleItemChange('description', e.target.value)} placeholder="Describe the dish..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Prep Time (min)</label>
                <input style={inputStyle} type="number" value={formData.preparation_time} onChange={e => handleItemChange('preparation_time', e.target.value)} placeholder="25" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Spice Level (0-5)</label>
                <input style={inputStyle} type="number" min="0" max="5" value={formData.spice_level} onChange={e => handleItemChange('spice_level', e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Serves</label>
                <input style={inputStyle} value={formData.serves} onChange={e => handleItemChange('serves', e.target.value)} placeholder="1 person" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Calories</label>
                <input style={inputStyle} value={formData.calories} onChange={e => handleItemChange('calories', e.target.value)} placeholder="620 kcal" />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Image URL</label>
                <input style={inputStyle} value={formData.image_url} onChange={e => handleItemChange('image_url', e.target.value)} placeholder="/images/menu/dish.jpg" />
              </div>
            </div>

            {/* Dietary Tags */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Dietary Tags</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {formData.dietary_tags.map(tag => (
                  <span key={tag} style={pillStyle}>{tag} <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: '1rem', lineHeight: 1 }}>&times;</button></span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type and press Enter" />
                <button className="btn btn-secondary" onClick={addTag} type="button">Add</button>
              </div>
            </div>

            {/* Ingredients */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Key Ingredients</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {formData.ingredients.map(ing => (
                  <span key={ing} style={pillStyle}>{ing} <button onClick={() => removeIngredient(ing)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)', fontSize: '1rem', lineHeight: 1 }}>&times;</button></span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={ingredientInput} onChange={e => setIngredientInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())} placeholder="Type and press Enter" />
                <button className="btn btn-secondary" onClick={addIngredient} type="button">Add</button>
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_available} onChange={e => handleItemChange('is_available', e.target.checked)} />
                Available
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_featured} onChange={e => handleItemChange('is_featured', e.target.checked)} />
                Featured
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveItem}><Save size={18} /> {editingItem ? 'Update Item' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {showModal === 'category' && (
        <div style={modalOverlayStyle} onClick={() => setShowModal(false)}>
          <div style={{ ...modalStyle, maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-text-muted)' }}><X size={24} /></button>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Name *</label>
              <input style={inputStyle} value={catFormData.name} onChange={e => handleCatChange('name', e.target.value)} placeholder="e.g. Rice Dishes" />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Slug</label>
              <input style={inputStyle} value={catFormData.slug} onChange={e => handleCatChange('slug', e.target.value)} placeholder="auto-generated" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCategory}><Save size={18} /> {editingCategory ? 'Update' : 'Add Category'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
