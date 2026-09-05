import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Phone, User, FileText, Search } from 'lucide-react';

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    gender: 'Kadin',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Müşterileri Çek
  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Müşteriler çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Form Değişiklik Yönetimi
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Yeni Müşteri Kaydet
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/customers', formData);
      setSuccess('Müşteri başarıyla kaydedildi!');
      setFormData({ first_name: '', last_name: '', phone: '', gender: 'Kadin', notes: '' });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu.');
    }
  };

  // Arama Filtreleme
  const filteredCustomers = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h2> Müşteri Yönetim Paneli</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* SOL: MÜŞTERİ EKLEME FORMU */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3><UserPlus size={18} /> Yeni Müşteri Ekle</h3>
          
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label>Adı:</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Soyadı:</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Telefon:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05xxxxxxxxx"
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Cinsiyet:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="Kadin">Kadın</option>
                <option value="Erkek">Erkek</option>
                <option value="Diger">Diğer</option>
              </select>
            </div>

            <div>
              <label>Sağlık / Özel Notlar:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Fıtık, alerji veya tercihler..."
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#28a745',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Kaydet
            </button>
          </form>
        </div>

        {/* SAĞ: MÜŞTERİ LİSTESİ */}
        <div>
          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="İsim veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#007bff', color: '#fff' }}>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>Cinsiyet</th>
                <th>Notlar</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>Kayıtlı müşteri bulunamadı.</td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.first_name} {c.last_name}</strong></td>
                    <td>{c.phone}</td>
                    <td>{c.gender}</td>
                    <td>{c.notes || '-'}</td>
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

export default CustomerManagement;
