import React, { useState, useEffect } from "react";
import axios from "axios";
import { UserPlus, Edit2, Trash2, RefreshCw } from "lucide-react";
import {
  StatusBadge,
  btnDelete,
  btnEdit,
  btnPrimary,
  btnSecondary,
  btnSuccess,
  cardClass,
  cn,
  fieldClass,
  labelClass,
  tableWrap,
  tdClass,
  thClass,
} from "../ui.jsx";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [editingEmpId, setEditingEmpId] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    profession_id: "",
    phone: "",
    commission_rate: 10.0,
    is_active: true,
  });

  const fetchData = async () => {
    try {
      const [empRes, profRes] = await Promise.all([
        axios.get("http://localhost:5000/api/employees"),
        axios.get("http://localhost:5000/api/professions"),
      ]);
      setEmployees(empRes.data);
      setProfessions(profRes.data);
    } catch (err) {
      console.error("Veriler çekilemedi:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEditClick = (emp) => {
    setEditingEmpId(emp.id);
    setFormData({
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      profession_id: emp.profession_id || "",
      phone: emp.phone || "",
      commission_rate: emp.commission_rate || 0,
      is_active: emp.is_active ?? true,
    });
  };

  const resetForm = () => {
    setEditingEmpId(null);
    setFormData({
      first_name: "",
      last_name: "",
      profession_id: "",
      phone: "",
      commission_rate: 10.0,
      is_active: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmpId) {
        await axios.put(
          `http://localhost:5000/api/employees/${editingEmpId}`,
          formData,
        );
        alert("Personel bilgileri güncellendi.");
      } else {
        await axios.post("http://localhost:5000/api/employees", formData);
        alert("Yeni personel eklendi.");
      }
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "İşlem sırasında bir hata oluştu.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu personeli silmek istediğinizden emin misiniz?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      alert("Personel kaydı silindi.");
      if (editingEmpId === id) resetForm();
      fetchData();
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Silme işlemi başarısız. Personelin geçmiş randevuları olabilir.",
      );
    }
  };

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Personel & Çalışan Yönetimi
      </h3>

      <div className="grid gap-5 lg:grid-cols-[1fr_2.5fr]">
        <form onSubmit={handleSubmit} className={cardClass}>
          <h4 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-100">
            {editingEmpId ? <RefreshCw size={18} /> : <UserPlus size={18} />}
            {editingEmpId ? "Personel Düzenle" : "Yeni Personel Ekle"}
          </h4>

          <div className="mb-3">
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
          <div className="mb-3">
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
          <div className="mb-3">
            <label className={labelClass}>Görev / Meslek</label>
            <select
              name="profession_id"
              value={formData.profession_id}
              onChange={handleChange}
              required
              className={fieldClass}
            >
              <option value="">-- Meslek Seçin --</option>
              {professions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className={labelClass}>Telefon</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="05xxxxxxxxx"
              className={fieldClass}
            />
          </div>
          <div className="mb-3">
            <label className={labelClass}>Prim Oranı (%)</label>
            <input
              type="number"
              step="0.5"
              name="commission_rate"
              value={formData.commission_rate}
              onChange={handleChange}
              className={fieldClass}
            />
          </div>
          {editingEmpId && (
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-slate-300 text-amber-600"
              />
              Aktif personel
            </label>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              className={cn(editingEmpId ? btnSuccess : btnPrimary, "flex-1")}
            >
              {editingEmpId ? "Güncelle" : "Kaydet"}
            </button>
            {editingEmpId && (
              <button type="button" onClick={resetForm} className={btnSecondary}>
                Vazgeç
              </button>
            )}
          </div>
        </form>

        <div className={tableWrap}>
          <table className="w-full text-left">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60">
              <tr>
                <th className={thClass}>Ad Soyad</th>
                <th className={thClass}>Görev</th>
                <th className={thClass}>Telefon</th>
                <th className={thClass}>Prim (%)</th>
                <th className={thClass}>Durum</th>
                <th className={thClass}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, i) => (
                <tr
                  key={emp.id}
                  className={cn(
                    "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                    i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                  )}
                >
                  <td className={cn(tdClass, "font-medium")}>
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className={tdClass}>
                    {emp.profession_name || emp.role || "Tanımsız"}
                  </td>
                  <td className={tdClass}>{emp.phone || "-"}</td>
                  <td className={tdClass}>%{emp.commission_rate}</td>
                  <td className={tdClass}>
                    <StatusBadge active={emp.is_active} />
                  </td>
                  <td className={cn(tdClass, "flex gap-2")}>
                    <button
                      onClick={() => handleEditClick(emp)}
                      className={btnEdit}
                    >
                      <Edit2 size={14} /> Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className={btnDelete}
                    >
                      <Trash2 size={14} /> Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
