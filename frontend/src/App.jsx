import React, { useState } from 'react';
import CustomerManagement from './components/CustomerManagement';
import ServiceManagement from './components/ServiceManagement';
import EmployeeManagement from './components/EmployeeManagement';
import AppointmentCalendar from './components/AppointmentManagement';
function App() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div>
      {/* ÜST MENÜ (NAVBAR) */}
      <nav style={{ background: '#1e293b', padding: '15px 20px', display: 'flex', gap: '15px' }}>
        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            background: activeTab === 'calendar' ? '#3b82f6' : '#334155',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
           Görsel Takvim
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          style={{
            background: activeTab === 'appointments' ? '#3b82f6' : '#334155',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
           Randevu Listesi & Ekleme
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          style={{
            background: activeTab === 'customers' ? '#3b82f6' : '#334155',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Müşteri Yönetimi
        </button>

        <button
          onClick={() => setActiveTab('services')}
          style={{
            background: activeTab === 'services' ? '#3b82f6' : '#334155',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Hizmet Yönetimi
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          style={{
            background: activeTab === 'employees' ? '#3b82f6' : '#334155',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Çalışan Yönetimi
        </button>
      </nav>

      {/* İÇERİK EKRANI */}
      <main>
        {activeTab === 'calendar' && <AppointmentCalendar />}
        {activeTab === 'appointments' && <AppointmentManagement />}
        {activeTab === 'customers' && <CustomerManagement />}
        {activeTab === 'services' && <ServiceManagement />}
        {activeTab === 'employees' && <EmployeeManagement />}
      </main>
    </div>
  );
}

export default App;