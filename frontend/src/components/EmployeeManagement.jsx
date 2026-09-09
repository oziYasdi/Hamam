import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Edit2, Trash2, RefreshCw } from 'lucide-react';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [editingEmpId, setEditingEmpId] = useState(null); // Düzenlenen personel ID'si

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profession_id: '',
    phone: '',
    commission_rate: 10.00,
    is_active: true
  });

  const fetchData = async () => {
    try {
      const [empRes, profRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employees'),
        axios.get('http://localhost:5000/api/professions')
      ]);
      setEmployees(empRes.data);
      setProfessions(profRes.data);
    } catch (err) {
      console.error('Veriler çekilemedi:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEditClick = (emp) => {
    setEditingEmpId(emp.id);
    setFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      profession_id: emp.profession_id || '',
      phone: emp.phone || '',
      commission_rate: emp.commission_rate || 0,
      is_active: emp.is_active ?? true
    });
  };

  const resetForm = () => {
    setEditingEmpId(null);
    setFormData({
      first_name: '',
      last_name: '',
      profession_id: '',
      phone: '',
      commission_rate: 10.00,
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmpId) {
        // Güncelleme işlemi (PUT)
        await axios.put(`http://localhost:5000/api/employees/${editingEmpId}`, formData);
        alert('Personel bilgileri güncellendi.');
      } else {
        // Yeni kayıt ekleme işlemi (POST)
        await axios.post('http://localhost:5000/api/employees', formData);
        alert('Yeni personel eklendi.');
      }
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'İşlem sırasında bir hata oluştu.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      alert('Personel kaydı silindi.');
      if (editingEmpId === id) resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Silme işlemi başarısız. Personelin geçmiş randevuları olabilir.');
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      <h3 style={{ marginBottom: '15px' }}>👥 Personel & Çalışan Yönetimi</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '20px' }}>
        {/* Form Alanı */}
        <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <h4 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingEmpId ? <RefreshCw size={18} /> : <UserPlus size={18} />} 
            {editingEmpId ? 'Personel Düzenle' : 'Yeni Personel Ekle'}
          </h4>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Adı:</label>
            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Soyadı:</label>
            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Görev / Meslek:</label>
            <select name="profession_id" value={formData.profession_id} onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}>
              <option value="">-- Meslek Seçin --</option>
              {professions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Telefon:</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="05xxxxxxxxx" style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Prim Oranı (%):</label>
            <input type="number" step="0.5" name="commission_rate" value={formData.commission_rate} onChange={handleChange} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>

          {editingEmpId && (
            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleChange} />
              <label htmlFor="is_active" style={{ fontSize: '13px', cursor: 'pointer' }}>Aktif Personel</label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: editingEmpId ? '#059669' : '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingEmpId ? 'Güncelle' : 'Kaydet'}
            </button>
            {editingEmpId && (
              <button type="button" onClick={resetForm} style={{ padding: '10px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Vazgeç
              </button>
            )}
          </div>
        </form>

        {/* Tablo Alanı */}
        <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th>Ad Soyad</th>
              <th>Görev</th>
              <th>Telefon</th>
              <th>Prim (%)</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp.id}>
                <td><strong>{emp.first_name} {emp.last_name}</strong></td>
                <td>{emp.profession_name || emp.role || 'Tanımsız'}</td>
                <td>{emp.phone || '-'}</td>
                <td>%{emp.commission_rate}</td>
                <td>
                  <span style={{ color: emp.is_active ? 'green' : 'red', fontWeight: 'bold' }}>
                    {emp.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleEditClick(emp)} style={{ padding: '4px 8px', background: '#eab308', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Edit2 size={14} /> Düzenle
                  </button>
                  <button onClick={() => handleDelete(emp.id)} style={{ padding: '4px 8px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={14} /> Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;