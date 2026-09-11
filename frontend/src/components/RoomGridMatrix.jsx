import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, Plus, Utensils, UserCheck, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

const RoomGridMatrix = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Adisyon Siparişleri (Geçici State)
  const [currentOrders, setCurrentOrders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Modallar ve Seçili Veriler
  const [activeModal, setActiveModal] = useState(null); // 'new' | 'detail' | null
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  // Form Tarafı
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    new_customer_name: '',
    service_id: '',
    employee_id: '',
    duration_minutes: 60,
    guest_count: 1,
    notes: ''
  });

  const [error, setError] = useState('');

  const fetchMatrixData = async () => {
    try {
      const [matrixRes, custRes, servRes, empRes, prodRes, catRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/room-schedule?date=${selectedDate}`),
        axios.get('http://localhost:5000/api/customers'),
        axios.get('http://localhost:5000/api/services'),
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/products'),
        axios.get('http://localhost:5000/api/product-groups').catch(() => ({ data: [] }))
      ]);

      setRooms(matrixRes.data.rooms);
      setAppointments(matrixRes.data.appointments);
      setCustomers(custRes.data);
      setServices(servRes.data.filter(s => s.is_active));
      setEmployees(empRes.data.filter(e => e.is_active));
      
      const activeProducts = prodRes.data.filter(p => p.is_active);
      setProducts(activeProducts);

      // Kategori Verilerini Ayarla
      let cats = catRes.data || [];
      if (cats.length === 0 && activeProducts.length > 0) {
        const uniqueCatIds = [...new Set(activeProducts.map(p => p.category_id || 1))];
        cats = uniqueCatIds.map(id => ({ id, name: `Grup ${id}` }));
      }
      setProductCategories(cats);
      if (cats.length > 0) setSelectedCategory(cats[0].id);

    } catch (err) {
      console.error('Matris verisi çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchMatrixData();
  }, [selectedDate]);

  // Boş Hücreye Tıklandığında
  const handleCellClick = (room, hour) => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      alert('Geçmiş bir tarihe yeni rezervasyon ekleyemezsiniz!');
      return;
    }

    setSelectedCell({ room, hour });
    setFormData({
      customer_id: '',
      new_customer_name: '',
      service_id: '',
      employee_id: '',
      duration_minutes: 60,
      guest_count: 1,
      notes: ''
    });
    setError('');
    setActiveModal('new');
  };

  // Dolu Hücreye Tıklandığında Adisyon Verileriyle Birlikte Paneli Aç
  const handleAppClick = async (app, e) => {
    e.stopPropagation();
    setSelectedApp(app);
    setError('');

    try {
      const ordersRes = await axios.get(`http://localhost:5000/api/room-orders/${app.id}`);
      setCurrentOrders(ordersRes.data || []);
    } catch (err) {
      console.error('Adisyon çekilemedi:', err);
      setCurrentOrders([]);
    }

    setActiveModal('detail');
  };

  // Yeni Oda Kaydı Kaydetme
  const handleNewSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (parseInt(formData.guest_count) > selectedCell.room.capacity) {
      setError(`Bu odanın maksimum kapasitesi ${selectedCell.room.capacity} kişidir!`);
      return;
    }

    const start_time = `${selectedDate}T${selectedCell.hour}:00`;

    try {
      await axios.post('http://localhost:5000/api/room-appointments', {
        room_id: selectedCell.room.id,
        customer_id: isNewCustomer ? null : formData.customer_id,
        new_customer_name: isNewCustomer ? formData.new_customer_name : null,
        service_id: formData.service_id,
        employee_id: formData.employee_id || null,
        start_time,
        duration_minutes: parseInt(formData.duration_minutes),
        guest_count: parseInt(formData.guest_count),
        notes: formData.notes
      });

      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      setError(err.response?.data?.error || 'Giriş kaydedilemedi.');
    }
  };

  // 1. Ürün Ekleme (Geçici Listeye Ekleme Yapılır, DB'ye Yazılmaz)
  const handleAddProductTemp = (product) => {
    const price = parseFloat(product.price) || 0;
    const newOrderItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: price,
      total_price: price
    };

    setCurrentOrders(prev => [...prev, newOrderItem]);
  };

  // 2. Adisyondan Ürün Silme (Geçici Listeden Çıkarır)
  const handleRemoveProductTemp = (indexToRemove) => {
    setCurrentOrders(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 3. Adisyonu Topluca Veritabanına Kaydetme
  const handleSaveOrders = async () => {
    if (!selectedApp) return;

    try {
      setIsSaving(true);
      await axios.post('http://localhost:5000/api/room-orders/bulk-save', {
        room_appointment_id: selectedApp.id,
        orders: currentOrders
      });

      alert('Adisyon başarıyla kaydedildi!');
      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      console.error(err);
      alert('Adisyon kaydedilirken hata oluştu: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  // Randevuyu İptal Et / Sil
  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/room-appointments/${id}`);
      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      alert(err.response?.data?.error || 'Silme işlemi başarısız oldu.');
    }
  };

  const findAppointment = (roomId, hour) => {
    return appointments.find(app => {
      if (app.room_id !== roomId) return false;
      const appHour = new Date(app.start_time).getHours().toString().padStart(2, '0') + ':00';
      return appHour === hour;
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* BAŞLIK VE TARİH FİLTRESİ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2><Clock size={24} /> Günlük Oda & Saat Bazlı Takip</h2>
        <div>
          <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Tarih Seçin:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* MATRİS TABLOSU */}
      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}>
        <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ width: '150px' }}>Oda / Saat</th>
              {HOURS.map(h => (
                <th key={h} style={{ fontSize: '13px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'left', paddingLeft: '10px' }}>
                  {room.name}
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                    Kapasite: {room.capacity} Kişi
                  </div>
                </td>

                {HOURS.map(hour => {
                  const app = findAppointment(room.id, hour);

                  return (
                    <td
                      key={hour}
                      onClick={() => !app && handleCellClick(room, hour)}
                      style={{
                        height: '50px',
                        cursor: app ? 'default' : 'pointer',
                        backgroundColor: app ? '#fee2e2' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      {app ? (
                        <div
                          onClick={(e) => handleAppClick(app, e)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            borderRadius: '4px',
                            padding: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <strong>{app.customer_fullname}</strong>
                          <span>{app.service_name}</span>
                          <span>{app.guest_count} Kişi</span>
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: '12px' }}>+</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: YENİ ODA GİRİŞİ */}
      {activeModal === 'new' && selectedCell && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3>Yeni Oda Girişi ({selectedCell.room.name} - {selectedCell.hour})</h3>
            <p style={{ fontSize: '12px', color: '#666' }}>Oda Kapasitesi: {selectedCell.room.capacity} Kişi</p>
            {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '13px' }}>{error}</div>}

            <form onSubmit={handleNewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px' }}>Müşteri Tipi:</label>
                <div style={{ marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(false)}
                    style={{ padding: '6px 12px', marginRight: '5px', background: !isNewCustomer ? '#2563eb' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px' }}
                  >
                    Kayıtlı Müşteri
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomer(true)}
                    style={{ padding: '6px 12px', background: isNewCustomer ? '#2563eb' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px' }}
                  >
                    Anlık / Yeni Müşteri
                  </button>
                </div>
              </div>

              {!isNewCustomer ? (
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required
                  style={inputStyle}
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Müşteri Adı Soyadı"
                  value={formData.new_customer_name}
                  onChange={(e) => setFormData({ ...formData, new_customer_name: e.target.value })}
                  required
                  style={inputStyle}
                />
              )}

              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">-- Hizmet / İşlem Seçin --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.price} ₺)</option>
                ))}
              </select>

              <select
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">-- Hizmet Verecek Personel --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px' }}>Kişi Sayısı:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedCell.room.capacity}
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px' }}>Süre (Dakika):</label>
                  <input
                    type="number"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Özel Notlar"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={inputStyle}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={cancelBtnStyle}>İptal</button>
                <button type="submit" style={saveBtnStyle}>Odayı Aç / Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GELİŞMİŞ ODA DETAYI VE 3 SÜTUNLU ADİSYON / POS PANELİ */}
      {activeModal === 'detail' && selectedApp && (() => {
        const appDate = new Date(selectedApp.start_time);
        appDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const isPastAppointment = appDate < today;

        const filteredProducts = products.filter(p => (p.category_id || 1) === selectedCategory);

        // Adisyon Ekstralar ve Genel Toplam Hesaplama
        const extrasTotal = currentOrders.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);
        const servicePrice = parseFloat(selectedApp.service_price || 0);
        const grandTotal = servicePrice + extrasTotal;

        return (
          <div style={modalOverlayStyle}>
            <div style={{ ...modalContentStyle, width: '1100px', maxWidth: '95vw', padding: '20px' }}>
              
              {/* PANOL BAŞLIĞI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Oda Adisyon & Hizmet Paneli ({selectedApp.room_name})</h3>
                {isPastAppointment && (
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    🔒 Geçmiş Kayıt (Sadece Görüntüleme)
                  </span>
                )}
              </div>
              <hr style={{ margin: '10px 0 15px 0' }} />

              {/* 3 SÜTUNLU POS DÜZENİ */}
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '15px', height: '480px' }}>
                
                {/* SOL SÜTUN: ÜRÜN GRUPLARI & ÜRÜN LİSTESİ */}
                <div style={{ border: '2px solid #000', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #ddd' }}>
                    {productCategories.map((cat, idx) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          background: selectedCategory === cat.id ? '#0f172a' : '#e2e8f0',
                          color: selectedCategory === cat.id ? '#fff' : '#000',
                          border: 'none',
                          padding: '8px 12px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat.name || idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* SEÇİLİ GRUBUN ÜRÜNLERİ */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredProducts.length === 0 ? (
                      <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                        Bu grupta ürün bulunamadı.
                      </div>
                    ) : (
                      filteredProducts.map(prod => (
                        <button
                          key={prod.id}
                          onClick={() => handleAddProductTemp(prod)}
                          disabled={isPastAppointment}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            cursor: isPastAppointment ? 'not-allowed' : 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{prod.name}</span>
                          <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px' }}>{prod.price} ₺</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* ORTA SÜTUN: REZERVASYON & ODA DETAYLARI */}
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ marginTop: 0, borderBottom: '1px solid #ccc', paddingBottom: '8px' }}>REZERVASYON BİLGİLERİ</h4>
                  <div style={{ fontSize: '15px', lineHeight: '2.4' }}>
                    <p style={{ margin: 0 }}><strong>ODA:</strong> {selectedApp.room_name}</p>
                    <p style={{ margin: 0 }}><strong>PERSONEL:</strong> {selectedApp.employee_fullname || 'Atanmadı'}</p>
                    <p style={{ margin: 0 }}><strong>MÜŞTERİ:</strong> {selectedApp.customer_fullname}</p>
                    <p style={{ margin: 0 }}><strong>HİZMET:</strong> {selectedApp.service_name}</p>
                    <p style={{ margin: 0 }}><strong>KİŞİ SAYISI:</strong> {selectedApp.guest_count} Kişi</p>
                    {selectedApp.notes && <p style={{ margin: 0, color: '#666', fontSize: '13px' }}><strong>NOT:</strong> {selectedApp.notes}</p>}
                  </div>
                </div>

                {/* SAĞ SÜTUN: ADİSYON SİPARİŞ LİSTESİ VE TUTAR HESABI (SCROLLBAR VE SİLME MEVCUT) */}
                <div style={{ border: '2px solid #000', borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #000', paddingBottom: '8px' }}>ADİSYON / SİPARİŞLER</h4>
                  
                  {/* SİPARİŞ EDİLEN ÜRÜNLERİN ALT ALTA LİSTESİ (SCROLLBAR EKLENDİ) */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', paddingRight: '4px' }}>
                    {currentOrders.length === 0 ? (
                      <div style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
                        Henüz sipariş eklenmedi.
                      </div>
                    ) : (
                      currentOrders.map((order, index) => (
                        <div key={order.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px dashed #ccc', fontSize: '13px' }}>
                          <span>{order.quantity || 1}x {order.product_name || order.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>{order.total_price} ₺</span>
                            {!isPastAppointment && (
                              <button
                                onClick={() => handleRemoveProductTemp(index)}
                                style={{
                                  background: '#ef4444',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                                title="Ürünü Adisyondan Çıkar"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* FİYAT HESAP DÖKÜMÜ VE BUTONLAR */}
                  <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Hizmet Bedeli:</span>
                      <span>{servicePrice} ₺</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                      <span>Ekstralar:</span>
                      <span>{extrasTotal} ₺</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', color: '#b91c1c', marginTop: '8px', borderTop: '1px solid #ddd', paddingTop: '6px' }}>
                      <span>GENEL TOPLAM:</span>
                      <span>{grandTotal} ₺</span>
                    </div>

                    {/* KAYDET VE KAPAT BUTONLARI */}
                    {!isPastAppointment && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={handleSaveOrders}
                          disabled={isSaving}
                          style={{
                            flex: 1,
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          onClick={() => setActiveModal(null)}
                          style={{
                            flex: 1,
                            backgroundColor: '#64748b',
                            color: '#fff',
                            border: 'none',
                            padding: '8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Kapat
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* ALT AKSİYON BUTONLARI */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                {!isPastAppointment ? (
                  <button 
                    onClick={() => handleDeleteAppointment(selectedApp.id)}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Rezervasyonu İptal Et / Sil
                  </button>
                ) : <div />}

                {isPastAppointment && (
                  <button onClick={() => setActiveModal(null)} style={cancelBtnStyle}>Kapat</button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

// CSS-in-JS Stillendirmeleri
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: '#fff', padding: '20px', borderRadius: '8px', width: '420px', maxWidth: '90%' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const saveBtnStyle = { background: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' };
const cancelBtnStyle = { background: '#64748b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' };

export default RoomGridMatrix;