import React, { useState } from 'react';
import { Calendar, Users, Settings } from 'lucide-react';
import AppointmentManagement from './components/AppointmentManagement';
import DefinitionsManagement from "./components/DefinitionsManagement";
import RoomGridMatrix from "./components/RoomGridMatrix"; 

function App() {
  // Aktif sekmeyi takip etmek için state tanımı
  const [activeTab, setActiveTab] = useState('appointments');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* ÜST GEZİNTİ MENÜSÜ (NAVBAR) */}
      <nav style={{
        background: '#0f172a',
        padding: '15px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#fff'
      }}>
        <h1 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px' }}>
          Context Hamam & SPA Takip Sistemi
        </h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeTab === 'appointments' ? '#2563eb' : 'transparent',
              color: '#fff'
            }}
          >
            <Calendar size={18} /> Randevu Listesi
          </button>


          <button
            onClick={() => setActiveTab('rooms')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeTab === 'rooms' ? '#2563eb' : 'transparent',
              color: '#fff'
            }}
          >
            <Calendar size={18} /> Randevu Listesi
          </button>
 

          <button
            onClick={() => setActiveTab('definitions')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px',
              border: 'none', cursor: 'pointer', fontWeight: 'bold',
              backgroundColor: activeTab === 'definitions' ? '#2563eb' : 'transparent',
              color: '#fff'
            }}
          >
            <Settings size={18} /> Tanımlar
          </button>
        </div>
      </nav>

      {/* İÇERİK ALANI */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'appointments' && <AppointmentManagement />}
        {activeTab === 'definitions' && <DefinitionsManagement />}
        {activeTab === 'rooms' && <RoomGridMatrix />}
      </div>
    </div>
  );
}

export default App;
