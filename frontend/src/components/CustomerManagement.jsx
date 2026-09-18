import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Search } from "lucide-react";
import {
  Alert,
  PageHeader,
  btnSuccess,
  cardClass,
  cn,
  fieldClass,
  labelClass,
  tableWrap,
  tdClass,
  thClass,
} from "../ui.jsx";

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    gender: "Kadin",
    notes: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/customers");
      setCustomers(res.data);
    } catch (err) {
      console.error("Müşteriler çekilemedi:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post("http://localhost:5000/api/customers", formData);
      setSuccess("Müşteri başarıyla kaydedildi!");
      setFormData({
        first_name: "",
        last_name: "",
        phone: "",
        gender: "Kadin",
        notes: "",
      });
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error || "Bir hata oluştu.");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      `${c.first_name} ${c.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm),
  );

  return (
    <div>
      <PageHeader
        icon={UserPlus}
        title="Müşteri Yönetim Paneli"
        subtitle="Misafir kayıtlarını arayın ve yeni müşteri ekleyin."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <div className={cardClass}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
            <UserPlus size={18} /> Yeni Müşteri Ekle
          </h3>

          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Adı</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Soyadı</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="05xxxxxxxxx"
                required
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Cinsiyet</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="Kadin">Kadın</option>
                <option value="Erkek">Erkek</option>
                <option value="Diger">Diğer</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Sağlık / Özel Notlar</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Fıtık, alerji veya tercihler..."
                className={fieldClass}
              />
            </div>
            <button type="submit" className={btnSuccess}>
              Kaydet
            </button>
          </form>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="İsim veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-0 bg-transparent text-sm outline-none dark:text-slate-100"
            />
          </div>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Ad Soyad</th>
                  <th className={thClass}>Telefon</th>
                  <th className={thClass}>Cinsiyet</th>
                  <th className={thClass}>Notlar</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Kayıtlı müşteri bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                        i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                      )}
                    >
                      <td className={cn(tdClass, "font-medium")}>
                        {c.first_name} {c.last_name}
                      </td>
                      <td className={tdClass}>{c.phone}</td>
                      <td className={tdClass}>{c.gender}</td>
                      <td className={tdClass}>{c.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagement;
