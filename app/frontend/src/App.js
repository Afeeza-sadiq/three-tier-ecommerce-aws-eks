import React, { useEffect, useState } from 'react';

// Baked in at build time (see Dockerfile / Jenkinsfile). Falls back to same-origin /api
// so the ALB Ingress can path-route /api/* to the backend service in production.
const API_URL = process.env.REACT_APP_API_URL || '/api';

export default function App() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const placeOrder = async (productId) => {
    setOrderStatus('placing');
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1, customer_name: 'Demo Customer' }),
      });
      if (!res.ok) throw new Error('order failed');
      setOrderStatus('placed');
    } catch {
      setOrderStatus('error');
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '40px auto', padding: '0 16px' }}>
      <h1>Cloud Store</h1>
      <p>Three-tier demo app — React frontend, Node/Express backend, MySQL (RDS) database.</p>

      {status === 'loading' && <p>Loading products…</p>}
      {status === 'error' && <p>Could not reach the backend API at {API_URL}.</p>}

      {status === 'ready' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <p>₹{p.price}</p>
              <button onClick={() => placeOrder(p.id)}>Buy now</button>
            </div>
          ))}
        </div>
      )}

      {orderStatus === 'placed' && <p style={{ color: 'green' }}>Order placed successfully!</p>}
      {orderStatus === 'error' && <p style={{ color: 'red' }}>Could not place order.</p>}
    </div>
  );
}
