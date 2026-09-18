import React, { useState, useEffect } from "react";
import axios from "axios";
import { PlusCircle } from "lucide-react";
import {
  Alert,
  PageHeader,
  StatusBadge,
  btnPrimary,
  btnSuccess,
  cardClass,
  cn,
  fieldClass,
  labelClass,
  tableWrap,
  tdClass,
  thClass,
} from "../ui.jsx";
import { formatCurrency } from "../currency.js";

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    duration_minutes: 60,
    price: "",
    currency: "EUR",
    gender_type: "Tumu",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchServices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/services");
      setServices(res.data);
    } catch (err) {
      console.error("Hizmetler çekilemedi:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post("http://localhost:5000/api/services", formData);
      setSuccess("Hizmet başarıyla eklendi!");
      setFormData({
        name: "",
        duration_minutes: 60,
        price: "",
        gender_type: "Tumu",
      });
      fetchServices();
    } catch (err) {
      setError(
        err.response?.data?.error || "Hizmet eklenirken bir hata oluştu.",
      );
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/services/${id}/status`, {
        is_active: !currentStatus,
      });
      fetchServices();
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
    }
  };

  return (
    <div>
      <PageHeader
        icon={PlusCircle}
        title="Hizmet & Bakım Yönetimi"
        subtitle="Paketleri ve hizmet fiyatlarını tanımlayın."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className={cardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <PlusCircle size={18} /> Yeni Hizmet Tanımla
          </h3>

          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Hizmet Adı</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Örn: Sultan Masajı"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Süre (Dakika)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                step="15"
                min="15"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ücret</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Para Birimi</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="TRY">₺ (TL)</option>
                <option value="EUR">€ (Euro)</option>
                <option value="USD">$ (Dolar)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cinsiyet / Alan Uygunluğu</label>
              <select
                name="gender_type"
                value={formData.gender_type}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="Tumu">Tümü (Herkes İçin)</option>
                <option value="Kadin">Sadece Kadınlar</option>
                <option value="Erkek">Sadece Erkekler</option>
              </select>
            </div>
            <button type="submit" className={btnPrimary}>
              Hizmeti Kaydet
            </button>
          </form>
        </div>

        <div className={tableWrap}>
          <table className="w-full text-left">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60">
              <tr>
                <th className={thClass}>Hizmet Adı</th>
                <th className={thClass}>Süre</th>
                <th className={thClass}>Fiyat</th>
                <th className={thClass}>Kitle</th>
                <th className={thClass}>Durum</th>
                <th className={thClass}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    Tanımlı hizmet bulunamadı.
                  </td>
                </tr>
              ) : (
                services.map((s, i) => (
                  <tr
                    key={s.id}
                    className={cn(
                      "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                      !s.is_active && "opacity-60",
                    )}
                  >
                    <td className={cn(tdClass, "font-medium")}>{s.name}</td>
                    <td className={tdClass}>{s.duration_minutes} dk</td>
                    <td className={tdClass}>
                      {formatCurrency(s.price, s.currency)}
                    </td>
                    <td className={tdClass}>{s.gender_type}</td>
                    <td className={tdClass}>
                      <StatusBadge active={s.is_active} />
                    </td>
                    <td className={tdClass}>
                      <button
                        onClick={() => toggleStatus(s.id, s.is_active)}
                        className={s.is_active ? "text-xs font-medium text-rose-600 hover:underline dark:text-rose-400" : cn(btnSuccess, "px-3 py-1.5 text-xs")}
                      >
                        {s.is_active ? "Pasife Al" : "Aktif Et"}
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
