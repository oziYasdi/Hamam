import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Briefcase, Phone, Percent } from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'Tellak',
    phone: '',
    commission_rate: '10.00'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Çalışanları Çek
  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Çalışanlar çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Yeni Çalışan Kaydet
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/employees', formData);
      setSuccess('Çalışan başarıyla kaydedildi!');
      setFormData({ first_name: '', last_name: '', role: 'Tellak', phone: '', commission_rate: '10.00' });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.error || 'Çalışan eklenirken bir hata oluştu.');
    }
  };

  // Aktif/Pasif Durumu Değiştir
  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/employees/${id}/status`, {
        is_active: !currentStatus
      });
      fetchEmployees();
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <h2> Personel & Çalışan Yönetimi</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* SOL: ÇALIŞAN EKLEME FORMU */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3><UserPlus size={18} /> Yeni Personel Ekle</h3>
          
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
              <label>Görevi / Rolü:</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="Tellak">Tellak</option>
                <option value="Natır">Natır</option>
                <option value="Masör">Masör</option>
                <option value="Masöz">Masöz</option>
                <option value="Resepsiyonist">Resepsiyonist</option>
                <option value="Temizlik">Temizlik Personeli</option>
              </select>
            </div>

            <div>
              <label>Telefon:</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05xxxxxxxxx"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Prim Oranı (%):</label>
              <input
                type="number"
                name="commission_rate"
                value={formData.commission_rate}
                onChange={handleChange}
                step="0.5"
                min="0"
                max="100"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#10b981',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Personeli Kaydet
            </button>
          </form>
        </div>

        {/* SAĞ: ÇALIŞAN LİSTESİ */}
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e293b', color: '#fff' }}>
                <th>Ad Soyad</th>
                <th>Görev</th>
                <th>Telefon</th>
                <th>Prim (%)</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Kayıtlı personel bulunamadı.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} style={{ opacity: emp.is_active ? 1 : 0.6 }}>
                    <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                    <td>{emp.role}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>%{emp.commission_rate}</td>
                    <td>
                      {emp.is_active ? (
                        <span style={{ color: 'green', fontWeight: 'bold' }}>Aktif</span>
                      ) : (
                        <span style={{ color: 'red', fontWeight: 'bold' }}>Pasif</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(emp.id, emp.is_active)}
                        style={{
                          background: emp.is_active ? '#ef4444' : '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        {emp.is_active ? 'Pasife Al' : 'Aktif Et'}
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

export default EmployeeManagement;