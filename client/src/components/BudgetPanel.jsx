import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../AppContext';
import { AlertTriangle, IndianRupee, ShieldCheck, ChevronDown, ChevronUp, Receipt } from 'lucide-react';

const CATEGORY_COLORS = {
  transportation: '#1a5c4c',
  accommodation: '#c8702a',
  food: '#2563eb',
  entryFees: '#7c3aed',
  activities: '#059669',
  guideCharges: '#d97706',
  additionalServices: '#0891b2',
  taxes: '#dc2626'
};

const CATEGORY_LABELS = {
  transportation: 'Transportation & Fuel',
  accommodation: 'Hotel Accommodation',
  food: 'Food & Meals',
  entryFees: 'Monument & Attraction Tickets',
  activities: 'Adventure & Activities',
  guideCharges: 'Tour Guide Charges',
  additionalServices: 'Eco-Permits & Services',
  taxes: 'GST & Tourism Cess (5%)'
};

export default function BudgetPanel({ plan, onOpenCheckout }) {
  const { t, lang } = useApp();
  const [showItemized, setShowItemized] = useState(false);
  const b = plan?.budget;
  if (!b) return null;

  const subtotals = b.subtotals || {
    transportation: b.transport || 0,
    accommodation: b.stay || 0,
    food: b.food || 0,
    entryFees: b.entry || 0,
    activities: b.activities || 0,
    guideCharges: b.guide || 0,
    additionalServices: b.additionalServices || 0,
    taxes: b.taxes || 0
  };

  const pie = Object.entries(subtotals)
    .filter(([key, val]) => key !== 'subtotalBeforeTaxes' && val > 0)
    .map(([key, val]) => ({
      key,
      name: CATEGORY_LABELS[key] || key,
      value: val,
      color: CATEGORY_COLORS[key] || '#6b7280'
    }));

  const inputBudget = (b.total || 0) + (b.remaining || 0);
  const overBudget = (b.remaining || 0) < 0;
  const isConfirmed = plan.meta?.isConfirmedBooking;

  return (
    <div className="card" style={{ padding: 18, background: '#ffffff', border: '1px solid #e2e2e0', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'Playfair Display, serif', color: '#1c1c1c' }}>
          {lang === 'kn' ? 'ಆಯವ್ಯಯ ಹಂಚಿಕೆ ಮತ್ತು ದರ' : 'Dynamic Trip Pricing Engine'}
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
            background: isConfirmed ? '#dcfce7' : '#f1f5f9',
            color: isConfirmed ? '#15803d' : '#475569',
            border: `1px solid ${isConfirmed ? '#bbf7d0' : '#cbd5e1'}`
          }}
        >
          {isConfirmed ? '✓ Confirmed Booking' : '⚡ Authoritative Estimate'}
        </span>
      </div>

      {pie.length > 0 && (
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={pie} dataKey="value" outerRadius={60} innerRadius={32} paddingAngle={2}>
              {pie.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
          </PieChart>
        </ResponsiveContainer>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {pie.map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
              <span>{item.name}</span>
            </div>
            <span style={{ fontWeight: 600, color: '#1c1c1c' }}>₹{item.value.toLocaleString('en-IN')}</span>
          </div>
        ))}

        <div style={{ borderTop: '1px solid #f0f0ee', paddingTop: 10, marginTop: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.02rem' }}>
            <span style={{ color: '#1c1c1c' }}>{lang === 'kn' ? 'ಒಟ್ಟು ವೆಚ್ಚ' : 'TOTAL TRIP COST'}</span>
            <span style={{ color: overBudget ? '#c0392b' : '#1a5c4c' }}>₹{(b.total || 0).toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#5a5a5a', marginTop: 4 }}>
            <span>Target Budget</span>
            <span>₹{inputBudget.toLocaleString('en-IN')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: 4, fontWeight: 600 }}>
            <span style={{ color: overBudget ? '#c0392b' : '#16a34a' }}>
              {overBudget ? 'Budget Exceeded' : 'Remaining Allocation'}
            </span>
            <span style={{ color: overBudget ? '#c0392b' : '#16a34a' }}>
              ₹{Math.abs(b.remaining || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Itemized Line Items Accordion */}
        {b.lineItems && b.lineItems.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() => setShowItemized(s => !s)}
              type="button"
              style={{
                width: '100%',
                padding: '6px 8px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: '#1a5c4c',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Receipt size={13} /> {showItemized ? 'Hide Itemized Breakdown' : `View ${b.lineItems.length} Itemized Services`}
              </span>
              {showItemized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showItemized && (
              <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 6, padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {b.lineItems.map((li, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', borderBottom: idx < b.lineItems.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{li.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{li.details || `${li.quantity} ${li.unit}`}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{li.total.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {overBudget && (
        <div style={{ marginTop: 12, background: '#fdf0ef', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 12px', fontSize: '0.8rem', color: '#c0392b', display: 'flex', gap: 6 }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Projected expense exceeds target budget by ₹{Math.abs(b.remaining).toLocaleString('en-IN')}. Consider switching travel mode or adjusting trip duration.
          </span>
        </div>
      )}

      {onOpenCheckout && (
        <button
          onClick={onOpenCheckout}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 12, justifyContent: 'center', fontSize: '0.88rem' }}
        >
          <ShieldCheck size={16} /> Booking Summary &amp; Checkout
        </button>
      )}

      <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#7a7a7a', borderTop: '1px solid #f0f0ee', paddingTop: 8 }}>
        Verified against Pravasa AI standard hospitality, fuel tariffs, and statutory 5% GST.
      </div>
    </div>
  );
}
