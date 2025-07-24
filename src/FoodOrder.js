import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { useNotifications } from './useNotifications';
import './FoodOrder.css';

const STATUS_OPTIONS = ['Bestellt', 'In Zubereitung', 'Abholbereit', 'Erledigt'];

// Eigene Ansicht für Kinder/Besteller
function UserOrderView({ user, orders, onNewOrder }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ details: '' });
  const myOrders = orders.filter(o => o.ordered_by === user.name);

  const handleInputChange = (e) => {
    setForm({ details: e.target.value });
  };

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!form.details) return;
    await onNewOrder(form.details);
    setForm({ details: '' });
    setShowForm(false);
  };

  return (
    <div>
      {showForm ? (
        <form onSubmit={handleAddOrder} className="add-order-form">
          <h3>Was möchtest du essen?</h3>
          <textarea
            name="details"
            placeholder="z.B. Nudeln mit Tomatensoße und ein Wasser"
            value={form.details}
            onChange={handleInputChange}
            required
          />
          <div className="form-actions">
            <button type="submit">Bestellung abschicken</button>
            <button type="button" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      ) : (
        <button className="add-order-button" onClick={() => setShowForm(true)}>+</button>
      )}

      <div className="my-orders-list">
        <h3>Deine Bestellungen</h3>
        {myOrders.length === 0 ? (
          <p className="empty-list">Du hast gerade nichts bestellt.</p>
        ) : (
          myOrders.map(order => (
            <div key={order.id} className={`order-item status-${order.status.replace(/\s+/g, '-')}`}>
              <p><strong>{order.details}</strong></p>
              <span>Status: <strong>{order.status}</strong></span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Eigene Ansicht für Eltern/Admins
function AdminOrderView({ orders, onUpdateStatus }) {
  return (
    <div className="order-list">
      <h3>Aktuelle Bestellungen</h3>
      {orders.length === 0 && <p className="empty-list">Keine offenen Bestellungen.</p>}
      {orders.map(order => (
        <div key={order.id} className={`order-item status-${order.status.replace(/\s+/g, '-')}`}>
          <div className="order-details">
            <p><strong>{order.details}</strong></p>
            <span className="ordered-by">Bestellt von: {order.ordered_by}</span>
          </div>
          <div className="order-status">
            <select 
              value={order.status}
              onChange={(e) => onUpdateStatus(order.id, e.target.value)}
            >
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FoodOrder({ user }) {
  const { sendNotification } = useNotifications();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('food_orders')
      .select('*')
      .neq('status', 'Erledigt')
      .order('created_at', { ascending: true });

    if (error) {
      setError('Fehler beim Laden der Bestellungen.');
      setOrders([]);
    } else {
      setOrders(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('food_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_orders' }, () => fetchOrders())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

  const handleAddOrder = async (details) => {
    const { data, error } = await supabase.from('food_orders').insert([
      { details, ordered_by: user.name }
    ]).select();

    if (error) {
      setError('Fehler beim Aufgeben der Bestellung.');
    } else if (data && data.length > 0) {
      // Send notification to admins
      sendNotification('Neue Essensbestellung', {
        body: `${user.name} hat eine neue Bestellung aufgegeben: ${details}`,
      });
    }
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('food_orders').update({ status: newStatus }).eq('id', id);
  };

  return (
    <div className="food-order-container">
      <h2>Essens-Bestellung</h2>
      {error && <p className="error-message">{error}</p>}
      {loading ? (
        <p>Lade Bestellungen...</p>
      ) : (
        user.is_admin ? (
          <AdminOrderView orders={orders} onUpdateStatus={updateStatus} />
        ) : (
          <UserOrderView user={user} orders={orders} onNewOrder={handleAddOrder} />
        )
      )}
    </div>
  );
}
