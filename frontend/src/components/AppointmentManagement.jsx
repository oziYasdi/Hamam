import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Ban,
  Calendar,
  Eye,
  Pencil,
  Search,
  X,
} from "lucide-react";
import {
  Alert,
  PageHeader,
  SoftBadge,
  btnPrimary,
  btnSecondary,
  cardClass,
  cn,
  fieldClass,
  labelClass,
  tableWrap,
  tdClass,
  thClass,
} from "../ui.jsx";
import { formatCurrency, formatMixedTotals, totalsByCurrency } from "../currency.js";

const STATUS_FILTERS = [
  { id: "all", label: "Hepsi" },
  { id: "Bekliyor", label: "Bekliyor" },
  { id: "Tamamlandi", label: "Tamamlandı" },
  { id: "Iptal", label: "İptal Edildi" },
];

const toDateInput = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ymdLocal = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return toDateInput(d);
};

const weekRange = (ref = new Date()) => {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateInput(start), end: toDateInput(end) };
};

const monthRange = (ref = new Date()) => {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start: toDateInput(start), end: toDateInput(end) };
};

const formatDateShort = (value) => {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${date} - ${time}`;
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const normalizeStatus = (status) => {
  const raw = String(status || "").trim();
  const key = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (["tamamlandi", "completed", "done"].includes(key)) return "Tamamlandi";
  if (["iptal", "iptal edildi", "cancelled", "canceled"].includes(key)) return "Iptal";
  return "Bekliyor";
};

const statusLabel = (status) => {
  const key = normalizeStatus(status);
  if (key === "Tamamlandi") return "Tamamlandı";
  if (key === "Iptal") return "İptal Edildi";
  return "Bekliyor";
};

const statusTone = (status) => {
  const key = normalizeStatus(status);
  if (key === "Tamamlandi") return "emerald";
  if (key === "Iptal") return "rose";
  return "amber";
};

const customerName = (app) =>
  app.customer_fullname ||
  [app.customer_first_name, app.customer_last_name].filter(Boolean).join(" ") ||
  app.new_customer_name ||
  "Misafir";

const AppointmentManagement = () => {
  const today = toDateInput(new Date());
  const [appointments, setAppointments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [datePreset, setDatePreset] = useState("today");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  const [activeModal, setActiveModal] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [appRes, roomsRes, custRes, empRes, servRes] = await Promise.all([
        axios.get("http://localhost:5000/api/room-appointments"),
        axios.get("http://localhost:5000/api/rooms"),
        axios.get("http://localhost:5000/api/customers").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/employees").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/appointment-services").catch(() => ({ data: [] })),
      ]);
      const asList = (data) => (Array.isArray(data) ? data : []);
      setAppointments(asList(appRes.data));
      setRooms(asList(roomsRes.data));
      setCustomers(asList(custRes.data));
      setEmployees(asList(empRes.data).filter((e) => e.is_active !== false));
      setServices(asList(servRes.data).filter((s) => s.is_active !== false));
    } catch (err) {
      console.error("Veriler çekilemedi:", err);
      setError("Randevu listesi yüklenirken bir hata oluştu.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const applyPreset = (preset) => {
    setDatePreset(preset);
    if (preset === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === "week") {
      const range = weekRange();
      setStartDate(range.start);
      setEndDate(range.end);
    } else if (preset === "month") {
      const range = monthRange();
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return appointments.filter((app) => {
      const when = ymdLocal(app.start_time || app.appointment_date);
      if (when && (when < startDate || when > endDate)) {
        return false;
      }

      const statusKey = normalizeStatus(app.status);
      if (statusFilter !== "all" && statusKey !== statusFilter) return false;

      if (roomFilter !== "all" && String(app.room_id) !== String(roomFilter)) {
        return false;
      }

      if (q) {
        const name = customerName(app).toLowerCase();
        const phone = String(app.customer_phone || "").toLowerCase();
        const phoneDigits = phone.replace(/\D/g, "");
        const room = String(app.room_name || "").toLowerCase();
        const matchesText =
          name.includes(q) || phone.includes(q) || room.includes(q);
        const matchesPhone = qDigits && phoneDigits.includes(qDigits);
        if (!matchesText && !matchesPhone) return false;
      }

      return true;
    });
  }, [appointments, startDate, endDate, searchTerm, statusFilter, roomFilter]);

  const amountLabel = (app) => {
    const servicePrice = Number(app.service_price || app.total_price || 0) || 0;
    const extras = Number(app.total_orders_amount || 0) || 0;
    const currency = app.service_currency || app.currency || "TRY";
    const map = totalsByCurrency([
      { total_price: servicePrice, currency },
      extras ? { total_price: extras, currency: "TRY" } : null,
    ].filter(Boolean));
    return formatMixedTotals(map);
  };

  const openDetail = async (app) => {
    setError("");
    setSelectedApp(app);
    setActiveModal("detail");
    try {
      const ordersRes = await axios.get(
        `http://localhost:5000/api/room-orders/${app.id}`,
      );
      setCurrentOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Adisyon çekilemedi:", err);
      setCurrentOrders([]);
    }
  };

  const openEdit = (app) => {
    setError("");
    setSuccess("");
    setSelectedApp(app);
    setEditForm({
      room_id: app.room_id || "",
      customer_id: app.customer_id || "",
      new_customer_name: app.new_customer_name || "",
      service_id: app.service_id || "",
      employee_id: app.employee_id || "",
      start_time: toDateTimeLocal(app.start_time),
      duration_minutes: app.duration_minutes || app.service_duration_minutes || 60,
      guest_count: app.guest_count || 1,
      notes: app.notes || "",
      status: normalizeStatus(app.status),
    });
    setActiveModal("edit");
  };

  const handleCancel = async (app) => {
    if (normalizeStatus(app.status) === "Iptal") return;
    if (!window.confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) {
      return;
    }
    try {
      await axios.patch(
        `http://localhost:5000/api/room-appointments/${app.id}/status`,
        { status: "Iptal" },
      );
      setSuccess("Randevu iptal edildi.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Randevu iptal edilemedi.");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp || !editForm) return;
    setSaving(true);
    setError("");
    try {
      await axios.patch(
        `http://localhost:5000/api/room-appointments/${selectedApp.id}`,
        {
          ...editForm,
          room_id: editForm.room_id || null,
          customer_id: editForm.customer_id || null,
          employee_id: editForm.employee_id || null,
          duration_minutes: Number(editForm.duration_minutes) || 60,
          guest_count: Number(editForm.guest_count) || 1,
        },
      );
      setSuccess("Randevu güncellendi.");
      setActiveModal(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Randevu güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white";

  return (
    <div>
      <PageHeader
        icon={Calendar}
        title="Liste Görünümü"
        subtitle="Randevuları tarih, oda, durum ve müşteri bilgisine göre süzün."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Bugün" },
              { id: "week", label: "Bu Hafta" },
              { id: "month", label: "Bu Ay" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  datePreset === preset.id
                    ? "bg-amber-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                {preset.label}
              </button>
            ))}

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="border-0 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
              />
              <span className="text-xs text-slate-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="border-0 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {formatDateShort(startDate)} - {formatDateShort(endDate)}
            </span>
          </div>

          <div className="relative min-w-[240px] flex-1 xl:max-w-sm">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Müşteri, telefon veya oda adı"
              className={cn(fieldClass, "pl-9")}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  statusFilter === item.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className={cn(fieldClass, "max-w-xs")}
          >
            <option value="all">Tüm Odalar</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={cn(tableWrap, "rounded-xl border-slate-200 dark:border-slate-800")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-slate-50/90 dark:bg-slate-800/60">
              <tr>
                <th className={thClass}>Kayıt Tarihi</th>
                <th className={thClass}>Randevu Tarihi & Saati</th>
                <th className={thClass}>Oda / Konum</th>
                <th className={thClass}>Müşteri Bilgisi</th>
                <th className={thClass}>Hizmet & Süre</th>
                <th className={thClass}>Personel</th>
                <th className={thClass}>Tutar & Ödeme</th>
                <th className={thClass}>Durum</th>
                <th className={cn(thClass, "text-right")}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Seçilen filtrelere uygun randevu bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr
                    key={app.id}
                    className="border-t border-slate-200 transition hover:bg-slate-50/90 dark:border-slate-800 dark:hover:bg-slate-800/40"
                  >
                    <td className={cn(tdClass, "whitespace-nowrap text-slate-500 dark:text-slate-400")}>
                      {formatDateTime(app.created_at || app.start_time)}
                    </td>
                    <td className={tdClass}>
                      <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                        {formatDateTime(app.start_time || app.appointment_date)}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span className="inline-flex max-w-[180px] items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {app.room_name || "—"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <div className="font-semibold text-slate-900 dark:text-slate-50">
                        {customerName(app)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {app.customer_phone || "Telefon yok"}
                      </div>
                    </td>
                    <td className={tdClass}>
                      {app.service_name || "Hizmet seçilmedi"}
                      <span className="text-slate-500 dark:text-slate-400">
                        {" "}
                        ({app.duration_minutes || app.service_duration_minutes || 0} dk)
                      </span>
                    </td>
                    <td className={tdClass}>
                      {app.employee_fullname || "Atanmadı"}
                    </td>
                    <td className={cn(tdClass, "whitespace-nowrap font-medium")}>
                      {amountLabel(app)}
                    </td>
                    <td className={tdClass}>
                      <SoftBadge tone={statusTone(app.status)}>
                        {statusLabel(app.status)}
                      </SoftBadge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          className={iconBtn}
                          title="Detay / Adisyon Gör"
                          onClick={() => openDetail(app)}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          title="Düzenle"
                          onClick={() => openEdit(app)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className={cn(
                            iconBtn,
                            "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/40",
                          )}
                          title="İptal Et"
                          disabled={normalizeStatus(app.status) === "Iptal"}
                          onClick={() => handleCancel(app)}
                        >
                          <Ban size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          Toplam {filteredAppointments.length} randevu listeleniyor
        </div>
      </div>

      {activeModal === "detail" && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className={cn(cardClass, "w-full max-w-2xl rounded-xl")}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Randevu Detayı & Adisyon
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedApp.room_name} · {formatDateTime(selectedApp.start_time)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={iconBtn}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="text-xs uppercase tracking-wide text-slate-400">Müşteri</div>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                  {customerName(selectedApp)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedApp.customer_phone || "Telefon yok"}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                <div className="text-xs uppercase tracking-wide text-slate-400">Hizmet</div>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-100">
                  {selectedApp.service_name || "—"} ({selectedApp.duration_minutes || 0} dk)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Personel: {selectedApp.employee_fullname || "Atanmadı"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Adisyon
              </h4>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                {currentOrders.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-500">
                    Bu randevuya ait adisyon kalemi yok.
                  </div>
                ) : (
                  currentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between border-b border-slate-200 px-3 py-2 last:border-0 dark:border-slate-800"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {order.quantity || 1}x {order.product_name || order.name}
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(order.total_price, order.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold text-slate-800 dark:text-slate-100">
                <span>Toplam</span>
                <span>{amountLabel(selectedApp)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setActiveModal(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "edit" && selectedApp && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className={cn(cardClass, "w-full max-w-xl rounded-xl")}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Randevuyu Düzenle
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className={iconBtn}
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Oda</label>
                <select
                  className={fieldClass}
                  value={editForm.room_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, room_id: e.target.value }))
                  }
                >
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Durum</label>
                <select
                  className={fieldClass}
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="Bekliyor">Bekliyor</option>
                  <option value="Tamamlandi">Tamamlandı</option>
                  <option value="Iptal">İptal Edildi</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Müşteri</label>
                <select
                  className={fieldClass}
                  value={editForm.customer_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      customer_id: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {editForm.new_customer_name || "Kayıtlı müşteri seçin"}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone || "Tel yok"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Hizmet</label>
                <select
                  className={fieldClass}
                  value={editForm.service_id}
                  onChange={(e) => {
                    const selected = services.find(
                      (s) => String(s.id) === String(e.target.value),
                    );
                    setEditForm((prev) => ({
                      ...prev,
                      service_id: e.target.value,
                      duration_minutes:
                        selected?.duration_minutes || prev.duration_minutes,
                    }));
                  }}
                >
                  <option value="">Hizmet seçin</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Personel</label>
                <select
                  className={fieldClass}
                  value={editForm.employee_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      employee_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Atanmadı</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name || `${e.first_name || ""} ${e.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tarih ve Saat</label>
                <input
                  type="datetime-local"
                  className={fieldClass}
                  value={editForm.start_time}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      start_time: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Süre (dk)</label>
                <input
                  type="number"
                  min="15"
                  className={fieldClass}
                  value={editForm.duration_minutes}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      duration_minutes: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notlar</label>
                <input
                  type="text"
                  className={fieldClass}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => setActiveModal(null)}
              >
                Vazgeç
              </button>
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagement;
