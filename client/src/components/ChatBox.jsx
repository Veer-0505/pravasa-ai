import React, { useState } from 'react';

export default function ChatBox({ plan, setPlan }) {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const send = async () => {
    setLoading(true);
    const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ message: msg, plan }) });
    const data = await res.json();
    setPlan(data);
    setLoading(false);
    setMsg('');
  };
  return (
    <div className="bg-white rounded-xl shadow p-3">
      <div className="font-semibold mb-2">Ask AI to tweak your trip</div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded p-2 text-sm" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="make day 2 less tiring" />
        <button onClick={send} disabled={loading} className="bg-teal-600 text-white px-3 py-2 rounded text-sm">{loading?'...':'Send'}</button>
      </div>
    </div>
  );
}
