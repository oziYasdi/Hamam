import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarPlus } from 'lucide-react';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    employee_id: '',
    appointment_date: '',
    total_price: '',
    notes: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [appRes, custRes, servRes, empRes] = await Promise.all([
        axios.get('http://localhost:5000/api/appointments'),
        axios.get('http://localhost:5000/api/customers'),
        axios.get('http://localhost:5000/api/services'),
        axios.get('http://localhost:5000/api/employees')
      ]);

      setAppointments(appRes.data);
      setCustomers(custRes.data);
      setServices(servRes.data.filter(s => s.is_active));
      setEmployees(empRes.data.filter(e => e.is_active));
    } catch (err) {
      console.error('Veriler çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleServiceChange = (e) => {
    const selectedServiceId = e.target.value;
    const selectedService = services.find(s => s.id === parseInt(selectedServiceId));

    setFormData(prev => ({
      ...prev,
      service_id: selectedServiceId,
      total_price: selectedService ? selectedService.price : ''
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('http://localhost:5000/api/appointments', formData);
      setSuccess('Randevu başarıyla oluşturuldu!');
      setFormData({
        customer_id: '',
        service_id: '',
        employee_id: '',
        appointment_date: '',
        total_price: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Randevu oluşturulurken bir hata oluştu.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/appointments/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error('Durum güncellenemedi:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h2> Randevu & Takvim Yönetimi</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginTop: '20px' }}>
        
        {/* SOL: RANDEVU OLUŞTURMA FORMU */}
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3><CalendarPlus size={18} /> Yeni Randevu Oluştur</h3>
          
          {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div>
              <label>Müşteri Seçin:</label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="">-- Müşteri Seçin --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.phone || 'Tel yok'})</option>
                ))}
              </select>
            </div>

            <div>
              <label>Hizmet / Paket Seçin:</label>
              <select
                name="service_id"
                value={formData.service_id}
                onChange={handleServiceChange}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="">-- Hizmet Seçin --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.price} {s.currency === 'EUR' ? '€' : s.currency === 'USD' ? '$' : '₺'} ({s.duration_minutes} dk)</option>
                ))}
              </select>
            </div>

            <div>
              <label>Atanacak Personel (Tellak/Masör):</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="">-- Personel Seçin (İsteğe Bağlı) --</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label>Randevu Tarihi ve Saati:</label>
              <input
                type="datetime-local"
                name="appointment_date"
                value={formData.appointment_date}
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Tutar:</label>
              <input
                type="number"
                name="total_price"
                value={formData.total_price}
                onChange={handleChange}
                step="0.01"
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <div>
              <label>Notlar / Özel İstekler:</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Örn: Müşteri hassas ciltli, orta sıcaklık istedi"
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Randevuyu Kaydet
            </button>
          </form>
        </div>

        {/* SAĞ: RANDEVU LİSTESİ */}
        <div>
          <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th>Tarih / Saat</th>
                <th>Müşteri</th>
                <th>Hizmet</th>
                <th>Personel</th>
                <th>Tutar</th>
                <th>Durum</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Henüz kayıtlı randevu yok.</td>
                </tr>
              ) : (
                appointments.map((app) => (
                  <tr key={app.id}>
                    <td>
                      {new Date(app.appointment_date).toLocaleString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td><strong>{app.customer_first_name} {app.customer_last_name}</strong></td>
                    <td>{app.service_name} ({app.duration_minutes} dk)</td>
                    <td>{app.employee_first_name ? `${app.employee_first_name} ${app.employee_last_name}` : <em style={{color:'#666'}}>Atanmadı</em>}</td>
                    <td>{app.total_price} {app.currency === 'EUR' ? '€' : app.currency === 'USD' ? '$' : '₺'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        color: '#fff',
                        backgroundColor: 
                          app.status === 'Tamamlandi' ? '#16a34a' :
                          app.status === 'Onaylandi' ? '#2563eb' :
                          app.status === 'Iptal' ? '#dc2626' : '#d97706'
                      }}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px' }}
                      >
                        <option value="Bekliyor">Bekliyor</option>
                        <option value="Onaylandi">Onaylandı</option>
                        <option value="Tamamlandi">Tamamlandı</option>
                        <option value="Iptal">İptal</option>
                      </select>
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

export default AppointmentManagement;