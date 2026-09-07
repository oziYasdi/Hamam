import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Clock, Tag, Users, CheckCircle, XCircle } from 'lucide-react';

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
  name: '',
  duration_minutes: 60,
  price: '',
  currency: 'EUR', // Turistik bölgeler için varsayılan Euro yapılabilir
  gender_type: 'Tumu'
});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hizmetleri Çek
  const fetchServices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/services');
      setServices(res.data);
    } catch (err) {
      console.error('Hizmetler çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Form Değişiklik Yönetimi
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Yeni Hizmet Kaydet
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/services', formData);
      setSuccess('Hizmet başarıyla eklendi!');
      setFormData({ name: '', duration_minutes: 60, price: '', gender_type: 'Tumu' });
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.error || 'Hizmet eklenirken bir hata oluştu.');
    }
  };

  // Aktif/Pasif Durumunu Değiştir
  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/services/${id}/status`, {
        is_active: !currentStatus
      });
      fetchServices();
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h2> Hizmet & Bakım Yönetimi</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* SOL: HİZMET EKLEME FORMU */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3><PlusCircle size={18} /> Yeni Hizmet Tanımla</h3>
          
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label>Hizmet Adı:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Örn: Sultan Masajı"
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Süre (Dakika):</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                step="15"
                min="15"
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Ücret:</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>
            <div>
                <label>Para Birimi:</label>
                <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                >
                <option value="TRY">₺ (TL)</option>
                <option value="EUR">€ (Euro)</option>
                <option value="USD">$ (Dolar)</option>
                </select>
            </div>

            <div>
              <label>Cinsiyet / Alan Uygunluğu:</label>
              <select
                name="gender_type"
                value={formData.gender_type}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="Tumu">Tümü (Herkes İçin)</option>
                <option value="Kadin">Sadece Kadınlar</option>
                <option value="Erkek">Sadece Erkekler</option>
              </select>
            </div>

            <button
              type="submit"
              style={{
                background: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Hizmeti Kaydet
            </button>
          </form>
        </div>

        {/* SAĞ: HİZMET LİSTESİ */}
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#343a40', color: '#fff' }}>
                <th>Hizmet Adı</th>
                <th>Süre</th>
                <th>Fiyat</th>
                <th>Kitle</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Tanımlı hizmet bulunamadı.</td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.6 }}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.duration_minutes} dk</td>
                    <td>
                    {s.price} {s.currency === 'EUR' ? '€' : s.currency === 'USD' ? '$' : '₺'}
                    </td>
                    <td>{s.gender_type}</td>
                    <td>
                      {s.is_active ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Aktif</span>
                      ) : (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>Pasif</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(s.id, s.is_active)}
                        style={{
                          background: s.is_active ? '#dc3545' : '#28a745',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {s.is_active ? 'Pasife Al' : 'Aktif Et'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ServiceManagement;