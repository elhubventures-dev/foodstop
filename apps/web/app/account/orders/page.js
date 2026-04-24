'use client';

export default function OrderHistory() {
  const orders = [
    { id: 'ORD-1234', date: 'Oct 24, 2026', total: 6500, status: 'Delivered', items: 'Jollof Rice, Plantain' },
    { id: 'ORD-1233', date: 'Oct 12, 2026', total: 4200, status: 'Delivered', items: 'Pounded Yam, Egusi' },
    { id: 'ORD-1220', date: 'Sep 30, 2026', total: 8500, status: 'Delivered', items: 'Asun, Grilled Catfish, Drinks' },
    { id: 'ORD-1215', date: 'Sep 15, 2026', total: 3000, status: 'Cancelled', items: 'Puff Puff, Zobo' },
  ];

  return (
    <div>
      <div className="account-header">
        <h1>Order History</h1>
        <p>Keep track of all your past orders and their status.</p>
      </div>

      <div className="data-list">
      {orders.map((order, i) => (
          <div key={i} className="data-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{order.id}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                {order.date}
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                {order.items}
              </p>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>₦{order.total.toLocaleString()}</div>
              
              <div style={{ 
                padding: '0.25rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: order.status === 'Delivered' ? 'var(--color-bg-secondary)' : 'var(--color-surface)',
                border: '1px solid',
                borderColor: order.status === 'Delivered' ? 'var(--color-success)' : 'var(--color-text-error)',
                color: order.status === 'Delivered' ? 'var(--color-success)' : 'var(--color-text-error)',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {order.status}
              </div>
              
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginTop: '0.25rem' }}
                onClick={() => alert(`Reordering ${order.id}...`)}
              >
                Reorder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
