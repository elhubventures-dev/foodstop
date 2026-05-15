'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, Plus, ToggleLeft, ToggleRight, Upload } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import {
  merchantApiGet,
  merchantApiGetText,
  merchantApiPatch,
  merchantApiPost,
  merchantApiPut,
} from '@/lib/merchantApi';
import { supabase, fetchPlatformFeatureFlags, isFeatureOn } from '@chopfast/shared';

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean | null;
  display_order?: number | null;
};

type MenuItem = {
  id: string;
  name: string;
  price: number | string;
  is_available?: boolean | null;
  slug: string;
  stock_quantity?: number | null;
};

export function MerchantMenuScreen() {
  const { accessToken } = useMerchantAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [inventoryOn, setInventoryOn] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const flags = await fetchPlatformFeatureFlags(supabase);
      if (alive) setInventoryOn(isFeatureOn(flags, 'inventory_stock'));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const loadCategories = useCallback(async () => {
    if (!accessToken) return;
    const data = await merchantApiGet<Category[]>('/merchant/menu/categories', accessToken);
    const list = Array.isArray(data) ? data : [];
    setCategories(list);
    setSelectedCat((prev) => prev ?? (list[0]?.id ?? null));
  }, [accessToken]);

  const loadItems = useCallback(async () => {
    if (!accessToken || !selectedCat) {
      setItems([]);
      return;
    }
    const path = `/merchant/menu/items?category_id=${encodeURIComponent(selectedCat)}`;
    const data = await merchantApiGet<MenuItem[]>(path, accessToken);
    setItems(Array.isArray(data) ? data : []);
  }, [accessToken, selectedCat]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      await loadCategories();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, [accessToken, loadCategories]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!accessToken || !selectedCat) return;
    let alive = true;
    (async () => {
      try {
        await loadItems();
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : 'Failed to load items');
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessToken, selectedCat, loadItems]);

  const addCategory = async () => {
    if (!accessToken || !newCatName.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPost('/merchant/menu/categories', accessToken, {
        name: newCatName.trim(),
      });
      setNewCatName('');
      await loadCategories();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const addItem = async () => {
    if (!accessToken || !selectedCat) return;
    const price = Math.round(Number(newItemPrice) * 100) / 100;
    if (!newItemName.trim() || !Number.isFinite(price) || price < 0) {
      setErr('Enter item name and valid price.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPost('/merchant/menu/items', accessToken, {
        category_id: selectedCat,
        name: newItemName.trim(),
        price,
      });
      setNewItemName('');
      setNewItemPrice('');
      await loadItems();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  };

  const downloadImportTemplate = async () => {
    if (!accessToken) return;
    setErr(null);
    try {
      const csv = await merchantApiGetText('/merchant/menu/import/template', accessToken);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'menu-import-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Download failed');
    }
  };

  const importCsvFile = async (file: File | null) => {
    if (!accessToken || !file) return;
    setBusy(true);
    setErr(null);
    setImportMsg(null);
    try {
      const csv = await file.text();
      const res = await merchantApiPost<{ created: number; errors: { line: number; message: string }[] }>(
        '/merchant/menu/import',
        accessToken,
        { csv },
      );
      const errs = res.errors?.length ? ` (${res.errors.length} row errors)` : '';
      setImportMsg(`Imported ${res.created} item(s)${errs}.`);
      await loadCategories();
      await loadItems();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const saveStock = async (item: MenuItem, raw: string) => {
    if (!accessToken) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) {
      setErr('Stock must be a non-negative integer.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPut(`/merchant/menu/items/${item.id}`, accessToken, {
        stock_quantity: n,
      });
      await loadItems();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleItem = async (item: MenuItem) => {
    if (!accessToken) return;
    const next = !(item.is_available !== false);
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPatch(
        `/merchant/menu/items/${item.id}/availability`,
        accessToken,
        { is_available: next },
      );
      await loadItems();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (!accessToken) return null;

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Loader2 className="spin" size={22} />
        Loading menu…
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Menu</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        Categories and items (scoped to your store via the ChopFast API).
        {inventoryOn && (
          <span>
            {' '}
            Stock counts from <code>menu_items.stock_quantity</code> are editable below while the inventory flag is on.
          </span>
        )}
      </p>
      {err && (
        <p style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{err}</p>
      )}
      {importMsg && (
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{importMsg}</p>
      )}

      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>CSV import</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
          Download the template, add rows (category_name, name, price required), then upload. New categories are
          created automatically when the name does not exist yet.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy}
            onClick={() => void downloadImportTemplate()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={16} /> Template
          </button>
          <label
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: busy ? 'not-allowed' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            <span className="btn btn-primary" style={{ pointerEvents: 'none', display: 'inline-flex', gap: 6 }}>
              <Upload size={16} /> Upload CSV
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = '';
                void importCsvFile(f);
              }}
            />
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Categories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.5rem 0.65rem',
                  borderRadius: 8,
                  border: '1px solid transparent',
                  background: selectedCat === c.id ? 'var(--color-bg-secondary)' : 'transparent',
                  cursor: 'pointer',
                  fontWeight: selectedCat === c.id ? 600 : 400,
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: 6 }}>
            <input
              placeholder="New category"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{ flex: 1, padding: '0.45rem 0.5rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
            />
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void addCategory()}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Items</h2>
          {!selectedCat ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Select or create a category.</p>
          ) : items.length === 0 ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>No items in this category yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((it) => (
                <li
                  key={it.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{it.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                      ₦{Number(it.price).toLocaleString('en-NG')}
                    </div>
                    {inventoryOn && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }} htmlFor={`st-${it.id}`}>
                          Stock
                        </label>
                        <input
                          id={`st-${it.id}`}
                          type="number"
                          min={0}
                          defaultValue={it.stock_quantity ?? ''}
                          key={`${it.id}-${it.stock_quantity ?? 'x'}`}
                          style={{ width: 72, padding: '0.25rem 0.35rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v === '' && (it.stock_quantity == null || it.stock_quantity === undefined)) return;
                            if (v === String(it.stock_quantity ?? '')) return;
                            void saveStock(it, v);
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => void toggleItem(it)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {it.is_available !== false ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    {it.is_available !== false ? 'Available' : 'Unavailable'}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedCat && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <input
                placeholder="Item name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                style={{ flex: '1 1 140px', padding: '0.45rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
              />
              <input
                placeholder="Price"
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                style={{ width: 100, padding: '0.45rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
              />
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void addItem()}>
                Add item
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
