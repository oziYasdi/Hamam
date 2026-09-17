import React, { useState } from "react";
import { Calendar, LayoutGrid, Settings } from "lucide-react";
import AppointmentManagement from "./components/AppointmentManagement";
import DefinitionsManagement from "./components/DefinitionsManagement";
import RoomGridMatrix from "./components/RoomGridMatrix";

function App() {
  // Varsayılan sekmeyi takvimli matris ekranı (rooms) yapıyoruz
  const [activeTab, setActiveTab] = useState("rooms");

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {/* ÜST GEZİNTİ MENÜSÜ (NAVBAR) */}
      <nav
        style={{
          background: "#0f172a",
          padding: "15px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "Space-between",
          color: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px", letterSpacing: "1px" }}>
          Context Hamam & SPA Takip Sistemi
        </h1>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor:
                activeTab === "rooms" ? "#2563eb" : "transparent",
              color: "#fff",
            }}
          >
            <LayoutGrid size={18} /> Oda & Takvim Matrisi
          </button>

          <button
            onClick={() => setActiveTab("appointments")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor:
                activeTab === "appointments" ? "#2563eb" : "transparent",
              color: "#fff",
            }}
          >
            <Calendar size={18} /> Liste Görünümü
          </button>

          <button
            onClick={() => setActiveTab("definitions")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              backgroundColor:
                activeTab === "definitions" ? "#2563eb" : "transparent",
              color: "#fff",
            }}
          >
            <Settings size={18} /> Tanımlar
          </button>
        </div>
      </nav>

      {/* İÇERİK ALANI */}
      <div style={{ padding: "20px" }}>
        {activeTab === "rooms" && <RoomGridMatrix />}
        {activeTab === "appointments" && <AppointmentManagement />}
        {activeTab === "definitions" && <DefinitionsManagement />}
      </div>
    </div>
  );
}

export default App;
