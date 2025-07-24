import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import './ShoppingList.css';

const CATEGORIES = ['Lebensmittel', 'Haushalt', 'Drogerie', 'Sonstiges'];

export default function ShoppingList({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ item: '', quantity: '', category: CATEGORIES[0] });
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      setError('Fehler beim Laden der Einkaufsliste.');
      setItems([]);
    } else {
      setItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();

    const channel = supabase.channel('shopping_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, payload => {
        fetchItems(); // Bei jeder Änderung neu laden
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!form.item) return;

    const { error } = await supabase.from('shopping_list').insert([
      {
        item: form.item,
        quantity: form.quantity || null,
        created_by: user.name,
        category: form.category,
      }
    ]);

    if (error) {
      setError('Fehler beim Hinzufügen des Artikels.');
    } else {
      setForm({ item: '', quantity: '', category: form.category });
      setError(null);
    }
  };

  const toggleItemDone = async (id, currentState) => {
    await supabase
      .from('shopping_list')
      .update({ is_done: !currentState })
      .eq('id', id);
  };

  const deleteItem = async (id) => {
    await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id);
  };

  return (
    <div className="shopping-list-container">
      <h2>Digitaler Einkaufszettel</h2>
      <form onSubmit={handleAddItem} className="add-item-form">
        <input
          type="text"
          name="item"
          placeholder="Was wird benötigt?"
          value={form.item}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="quantity"
          placeholder="Menge (z.B. 1kg)"
          value={form.quantity}
          onChange={handleInputChange}
        />
        <select name="category" value={form.category} onChange={handleInputChange}>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button type="submit">Hinzufügen</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading ? (
        <p>Lade Liste...</p>
      ) : (
        <div className="item-list">
          <h3>Offen</h3>
          {CATEGORIES.map(category => {
            const openItems = items.filter(it => !it.is_done && it.category === category);
            if (openItems.length === 0) return null;
            return (
              <div key={category} className="category-section">
                <h4>{category}</h4>
                <ul>
                  {openItems.map(it => (
                    <li key={it.id} className="item">
                      <div className="item-details" onClick={() => toggleItemDone(it.id, it.is_done)}>
                        <input type="checkbox" checked={it.is_done} readOnly />
                        <span className="item-name">{it.item}</span>
                        {it.quantity && <span className="item-quantity">({it.quantity})</span>}
                      </div>
                      <button onClick={() => deleteItem(it.id)} className="delete-button">×</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <h3 className="done-header">Erledigt</h3>
          {items.filter(it => it.is_done).length === 0 && <p className="empty-list">Noch nichts eingekauft.</p>}
          {items.filter(it => it.is_done).map(it => (
            <li key={it.id} className="item done">
              <div className="item-details" onClick={() => toggleItemDone(it.id, it.is_done)}>
                <input type="checkbox" checked={it.is_done} readOnly />
                <span className="item-name">{it.item}</span>
                {it.quantity && <span className="item-quantity">({it.quantity})</span>}
              </div>
              <button onClick={() => deleteItem(it.id)} className="delete-button">×</button>
            </li>
          ))}
        </div>
      )}
    </div>
  );
}
