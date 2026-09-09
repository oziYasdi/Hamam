import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Layers, Package, Briefcase, DoorOpen, Coins, Users, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import EmployeeManagement from './EmployeeManagement';

const DefinitionsManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('product-groups');

  // Listeler
  const [productGroups, setProductGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  // Düzenleme Modu Seçili ID'leri
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProfId, setEditingProfId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);

  // Form State'leri
  const [groupForm, setGroupForm] = useState({ name: '', display_order: 0, is_active: true });
  const [productForm, setProductForm] = useState({ group_id: '', name: '', price: '', currency: 'TRY', duration_minutes: '', is_active: true });
  const [profForm, setProfForm] = useState({ name: '', display_order: 0 });
  const [roomForm, setRoomForm] = useState({ name: '', capacity: 1, display_order: 0 });
  const [currForm, setCurrForm] = useState({ code: '', name: '', symbol: '', exchange_rate: 1.0 });

  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchAllData = async () => {
    try {
      const [groupsRes, prodsRes, profsRes, roomsRes, currsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/product-groups'),
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/professions'),
        axios.get('http://localhost:5000/api/rooms'),
        axios.get('http://localhost:5000/api/currencies')
      ]);

      setProductGroups(groupsRes.data);
      setProducts(prodsRes.data);
      setProfessions(profsRes.data);
      setRooms(roomsRes.data);
      setCurrencies(currsRes.data);
    } catch (err) {
      console.error('Tanım verileri çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Ürün Grubu İşlemleri
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroupId) {
        await axios.put(`http://localhost:5000/api/product-groups/${editingGroupId}`, groupForm);
        showMsg('Ürün grubu güncellendi.');
      } else {
        await axios.post('http://localhost:5000/api/product-groups', groupForm);
        showMsg('Ürün grubu eklendi.');
      }
      resetGroupForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'İşlem başarısız.', 'error');
    }
  };

  const handleEditGroupClick = (group) => {
    setEditingGroupId(group.id);
    setGroupForm({ name: group.name, display_order: group.display_order || 0, is_active: group.is_active ?? true });
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Bu ürün grubunu silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/product-groups/${id}`);
      showMsg('Ürün grubu silindi.');
      if (editingGroupId === id) resetGroupForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Silme başarısız. Bağlı ürünler olabilir.', 'error');
    }
  };

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm({ name: '', display_order: 0, is_active: true });
  };

  // Ürün İşlemleri
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await axios.put(`http://localhost:5000/api/products/${editingProductId}`, productForm);
        showMsg('Ürün başarıyla güncellendi.');
      } else {
        await axios.post('http://localhost:5000/api/products', productForm);
        showMsg('Ürün başarıyla eklendi.');
      }
      resetProductForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'İşlem başarısız.', 'error');
    }
  };

  const handleEditProductClick = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      group_id: prod.group_id || '',
      name: prod.name,
      price: prod.price,
      currency: prod.currency || 'TRY',
      duration_minutes: prod.duration_minutes || '',
      is_active: prod.is_active ?? true
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      showMsg('Ürün silindi.');
      if (editingProductId === id) resetProductForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Silme başarısız.', 'error');
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({ group_id: '', name: '', price: '', currency: 'TRY', duration_minutes: '', is_active: true });
  };

  // Meslek İşlemleri (Ekle, Güncelle, Sil)
  const handleSaveProf = async (e) => {
    e.preventDefault();
    try {
      if (editingProfId) {
        await axios.put(`http://localhost:5000/api/professions/${editingProfId}`, profForm);
        showMsg('Meslek tanımı güncellendi.');
      } else {
        await axios.post('http://localhost:5000/api/professions', profForm);
        showMsg('Meslek tanımı eklendi.');
      }
      resetProfForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'İşlem başarısız.', 'error');
    }
  };

  const handleEditProfClick = (prof) => {
    setEditingProfId(prof.id);
    setProfForm({ name: prof.name, display_order: prof.display_order || 0 });
  };

  const handleDeleteProf = async (id) => {
    if (!window.confirm('Bu meslek tanımını silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/professions/${id}`);
      showMsg('Meslek tanımı silindi.');
      if (editingProfId === id) resetProfForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Silme başarısız. Bağlı personel kayıtları olabilir.', 'error');
    }
  };

  const resetProfForm = () => {
    setEditingProfId(null);
    setProfForm({ name: '', display_order: 0 });
  };

  // Oda ve Döviz İşlemleri
  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/rooms', roomForm);
      showMsg('Oda tanımı eklendi.');
      setRoomForm({ name: '', capacity: 1, display_order: 0 });
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Oda eklenemedi.', 'error');
    }
  };

  // Oda Kaydet / Güncelle Fonksiyonu
const handleSaveRoom = async (e) => {
  e.preventDefault();
  try {
    if (editingRoomId) {
      await axios.put(`http://localhost:5000/api/rooms/${editingRoomId}`, roomForm);
      showMsg('Oda tanımı başarıyla güncellendi.');
    } else {
      await axios.post('http://localhost:5000/api/rooms', roomForm);
      showMsg('Oda tanımı eklendi.');
    }
    resetRoomForm();
    fetchAllData();
  } catch (err) {
    showMsg(err.response?.data?.error || 'Oda işlemi başarısız.', 'error');
  }
};

const handleEditRoomClick = (room) => {
  setEditingRoomId(room.id);
  setRoomForm({
    name: room.name,
    capacity: room.capacity || 1,
    display_order: room.display_order || 0,
    is_active: room.is_active ?? true
  });
};

const handleDeleteRoom = async (id) => {
  if (!window.confirm('Bu odayı silmek istediğinizden emin misiniz?')) return;
  try {
    await axios.delete(`http://localhost:5000/api/rooms/${id}`);
    showMsg('Oda tanımı silindi.');
    if (editingRoomId === id) resetRoomForm();
    fetchAllData();
  } catch (err) {
    showMsg(err.response?.data?.error || 'Silme başarısız. Bu odada yapılmış randevular bulunabilir.', 'error');
  }
};

const resetRoomForm = () => {
  setEditingRoomId(null);
  setRoomForm({ name: '', capacity: 1, display_order: 0, is_active: true });
};





  const handleAddCurr = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/currencies', currForm);
      showMsg('Döviz tanımı eklendi.');
      setCurrForm({ code: '', name: '', symbol: '', exchange_rate: 1.0 });
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || 'Döviz eklenemedi.', 'error');
    }
  };

  const toggleRoomStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/rooms/${id}/status`, { is_active: !currentStatus });
      fetchAllData();
    } catch (err) {
      console.error('Oda durumu güncellenemedi:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>⚙️ Sistem Tanımları (TANIMLAR)</h2>

      {message.text && (
        <div style={{
          padding: '10px 15px', borderRadius: '6px', marginBottom: '15px', fontWeight: 'bold',
          backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#991b1b' : '#166534',
          border: `1px solid ${message.type === 'error' ? '#fecaca' : '#bbf7d0'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Alt Menü Tabları */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'product-groups', label: 'Ürün Grupları', icon: <Layers size={18} /> },
          { id: 'products', label: 'Ürün Tanımları', icon: <Package size={18} /> },
          { id: 'professions', label: 'Meslek Tanımları', icon: <Briefcase size={18} /> },
          { id: 'employees', label: 'Personel Tanımları', icon: <Users size={18} /> },
          { id: 'rooms', label: 'Oda Tanımları', icon: <DoorOpen size={18} /> },
          { id: 'currencies', label: 'Döviz Tanımları', icon: <Coins size={18} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeSubTab === tab.id ? '#0f172a' : '#f1f5f9',
              color: activeSubTab === tab.id ? '#fff' : '#475569'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- 1. ÜRÜN GRUPLARI TABI --- */}
      {activeSubTab === 'product-groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <form onSubmit={handleSaveGroup} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h3>{editingGroupId ? <RefreshCw size={18} /> : <Plus size={18} />} {editingGroupId ? 'Grup Düzenle' : 'Yeni Ürün Grubu'}</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Grup Adı:</label>
              <input type="text" value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: Masaj Çeşitleri" />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Sıra No:</label>
              <input type="number" value={groupForm.display_order} onChange={e => setGroupForm({ ...groupForm, display_order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            {editingGroupId && (
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="grp_active" checked={groupForm.is_active} onChange={e => setGroupForm({ ...groupForm, is_active: e.target.checked })} />
                <label htmlFor="grp_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Aktif Durumda</label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: editingGroupId ? '#059669' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{editingGroupId ? 'Güncelle' : 'Kaydet'}</button>
              {editingGroupId && <button type="button" onClick={resetGroupForm} style={{ padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Vazgeç</button>}
            </div>
          </form>

          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th>Sıra</th>
                <th>Grup Adı</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {productGroups.map(g => (
                <tr key={g.id}>
                  <td>{g.display_order}</td>
                  <td><strong>{g.name}</strong></td>
                  <td><span style={{ color: g.is_active ? 'green' : 'red', fontWeight: 'bold' }}>{g.is_active ? 'Aktif' : 'Pasif'}</span></td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditGroupClick(g)} style={{ padding: '4px 8px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit2 size={14} /> Düzenle</button>
                    <button onClick={() => handleDeleteGroup(g.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={14} /> Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- 2. ÜRÜN TANIMLARI TABI --- */}
      {activeSubTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <form onSubmit={handleSaveProduct} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h3>{editingProductId ? <RefreshCw size={18} /> : <Plus size={18} />} {editingProductId ? 'Ürün / Hizmet Düzenle' : 'Yeni Ürün / Hizmet'}</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Ürün Grubu:</label>
              <select value={productForm.group_id} onChange={e => setProductForm({ ...productForm, group_id: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="">-- Grup Seçin --</option>
                {productGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Ürün / Hizmet Adı:</label>
              <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: Klasik Masaj" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '13px' }}>Fiyat:</label>
                <input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px' }}>Para Birimi:</label>
                <select value={productForm.currency} onChange={e => setProductForm({ ...productForm, currency: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  {currencies.map(c => <option key={c.id} value={c.code}>{c.code} ({c.symbol})</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Süre (Dakika - İsteğe Bağlı):</label>
              <input type="number" value={productForm.duration_minutes} onChange={e => setProductForm({ ...productForm, duration_minutes: e.target.value })} placeholder="Örn: 45" style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            {editingProductId && (
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="prod_active" checked={productForm.is_active} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} />
                <label htmlFor="prod_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Aktif Satışta</label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: editingProductId ? '#059669' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{editingProductId ? 'Güncelle' : 'Kaydet'}</button>
              {editingProductId && <button type="button" onClick={resetProductForm} style={{ padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Vazgeç</button>}
            </div>
          </form>

          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th>Ürün Adı</th>
                <th>Grubu</th>
                <th>Fiyat</th>
                <th>Süre</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.group_name || 'Grupsuz'}</td>
                  <td>{p.price} {p.currency}</td>
                  <td>{p.duration_minutes ? `${p.duration_minutes} dk` : '-'}</td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditProductClick(p)} style={{ padding: '4px 8px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Edit2 size={14} /> Düzenle</button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}><Trash2 size={14} /> Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- 3. MESLEK TANIMLARI TABI --- */}
      {activeSubTab === 'professions' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <form onSubmit={handleSaveProf} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <h3>{editingProfId ? <RefreshCw size={18} /> : <Plus size={18} />} {editingProfId ? 'Meslek Düzenle' : 'Yeni Meslek Tanımı'}</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Meslek Adı:</label>
              <input type="text" value={profForm.name} onChange={e => setProfForm({ ...profForm, name: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: Tellak, Masör" />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '13px' }}>Sıra No:</label>
              <input type="number" value={profForm.display_order} onChange={e => setProfForm({ ...profForm, display_order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: editingProfId ? '#059669' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingProfId ? 'Güncelle' : 'Kaydet'}
              </button>
              {editingProfId && (
                <button type="button" onClick={resetProfForm} style={{ padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Vazgeç</button>
              )}
            </div>
          </form>

          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th>Sıra</th>
                <th>Meslek Unvanı</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {professions.map(pr => (
                <tr key={pr.id}>
                  <td>{pr.display_order}</td>
                  <td><strong>{pr.name}</strong></td>
                  <td style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditProfClick(pr)} style={{ padding: '4px 8px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Edit2 size={14} /> Düzenle
                    </button>
                    <button onClick={() => handleDeleteProf(pr.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={14} /> Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- 4. PERSONEL TANIMLARI TABI --- */}
      {activeSubTab === 'employees' && (
        <div>
          <EmployeeManagement />
        </div>
      )}
{/* --- 5. ODA TANIMLARI TABI --- */}
{activeSubTab === 'rooms' && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
    <form onSubmit={handleSaveRoom} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
      <h3>
        {editingRoomId ? <RefreshCw size={18} /> : <Plus size={18} />} 
        {editingRoomId ? 'Oda Düzenle' : 'Yeni Oda Tanımı'}
      </h3>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>Oda / Alan Adı:</label>
        <input type="text" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: VIP Masaj Odası 1" />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>Kapasite (Kişi):</label>
        <input type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 1 })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>Sıra No:</label>
        <input type="number" value={roomForm.display_order} onChange={e => setRoomForm({ ...roomForm, display_order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
      </div>
      {editingRoomId && (
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" id="room_active" checked={roomForm.is_active} onChange={e => setRoomForm({ ...roomForm, is_active: e.target.checked })} />
          <label htmlFor="room_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Aktif Durumda</label>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" style={{ flex: 1, padding: '10px', background: editingRoomId ? '#059669' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          {editingRoomId ? 'Güncelle' : 'Kaydet'}
        </button>
        {editingRoomId && (
          <button type="button" onClick={resetRoomForm} style={{ padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Vazgeç
          </button>
        )}
      </div>
    </form>

    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ background: '#0f172a', color: '#fff' }}>
          <th>Sıra</th>
          <th>Oda Adı</th>
          <th>Kapasite</th>
          <th>Durum</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map(rm => (
          <tr key={rm.id}>
            <td>{rm.display_order}</td>
            <td><strong>{rm.name}</strong></td>
            <td>{rm.capacity} Kişilik</td>
            <td><span style={{ color: rm.is_active ? 'green' : 'red', fontWeight: 'bold' }}>{rm.is_active ? 'Aktif' : 'Pasif'}</span></td>
            <td style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleEditRoomClick(rm)} style={{ padding: '4px 8px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Edit2 size={14} /> Düzenle
              </button>
              <button onClick={() => handleDeleteRoom(rm.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={14} /> Sil
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

  {/* --- DÖVİZ TANIMLARI TABI --- */}
{activeSubTab === 'currencies' && (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
    {/* Sol Form Alanı */}
    <form onSubmit={handleAddCurr} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
      <h3><Plus size={18} /> Yeni Döviz Tanımı</h3>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 15px 0' }}>
        Kurlar Merkez Bankası verilerine göre her gün otomatik güncellenmektedir.
      </p>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>Döviz Kodu (USD, EUR):</label>
        <input type="text" value={currForm.code} onChange={e => setCurrForm({ ...currForm, code: e.target.value.toUpperCase() })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: EUR" />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', fontSize: '13px' }}>Tanım / Adı:</label>
        <input type="text" value={currForm.name} onChange={e => setCurrForm({ ...currForm, name: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: Euro" />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px' }}>Sembol:</label>
          <input type="text" value={currForm.symbol} onChange={e => setCurrForm({ ...currForm, symbol: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} placeholder="Örn: €" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '13px' }}>Başlangıç Kuru (TRY):</label>
          <input type="number" step="0.0001" value={currForm.exchange_rate} onChange={e => setCurrForm({ ...currForm, exchange_rate: parseFloat(e.target.value) || 1 })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
        </div>
      </div>
      <button type="submit" style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Kaydet</button>
    </form>

    {/* Sağ Tablo Alanı */}
    <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ background: '#0f172a', color: '#fff' }}>
          <th>Kod</th>
          <th>Döviz Adı</th>
          <th>Sembol</th>
          <th>Güncel Kur (TRY)</th>
        </tr>
      </thead>
      <tbody>
        {currencies.map(c => (
          <tr key={c.id}>
            <td><strong>{c.code}</strong></td>
            <td>{c.name}</td>
            <td>{c.symbol}</td>
            <td><strong>{c.exchange_rate} ₺</strong></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


    </div>
  );
};

export default DefinitionsManagement;