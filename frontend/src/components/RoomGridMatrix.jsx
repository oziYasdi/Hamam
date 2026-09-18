import React, { useState, useEffect } from "react";
import axios from "axios";
import { Clock, Plus, Trash2, Save, X, Lock } from "lucide-react";
import {
  Alert,
  PageHeader,
  bookingTones,
  btnDelete,
  btnPrimary,
  btnSecondary,
  btnSuccess,
  cardClass,
  cn,
  fieldClass,
  labelClass,
} from "../ui.jsx";
import {
  formatCurrency,
  formatMixedTotals,
  sumItemsToTry,
  totalsByCurrency,
} from "../currency.js";

const HOURS = Array.from(
  { length: 16 },
  (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`,
);

const RoomGridMatrix = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [rooms, setRooms] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);

  const [currentOrders, setCurrentOrders] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    new_customer_name: "",
    service_id: "",
    employee_id: "",
    duration_minutes: 60,
    guest_count: 1,
    notes: "",
  });

  const [error, setError] = useState("");
  const [appointmentServices, setAppointmentServices] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ TRY: 1 });
  const [exchangeDate, setExchangeDate] = useState(null);

  useEffect(() => {
    fetchMatrixData();
  }, [selectedDate]);

  const fetchMatrixData = async () => {
    try {
      const [matrixRes, customersRes, employeesRes, groupsRes, servicesRes, ratesRes] =
        await Promise.all([
          axios.get(
            `http://localhost:5000/api/room-schedule?date=${selectedDate}`,
          ),
          axios.get("http://localhost:5000/api/customers"),
          axios.get("http://localhost:5000/api/employees"),
          axios.get("http://localhost:5000/api/product-groups?active=true"),
          axios.get("http://localhost:5000/api/appointment-services"),
          axios.get("http://localhost:5000/api/exchange-rates").catch(() => ({
            data: { rates: { TRY: 1 } },
          })),
        ]);

      setExchangeRates({ TRY: 1, ...(ratesRes.data?.rates || {}) });
      setExchangeDate(ratesRes.data?.date || null);

      setRooms(matrixRes.data.rooms || []);
      setAppointments(matrixRes.data.appointments || []);
      setCustomers(customersRes.data || []);
      setEmployees(
        (employeesRes.data || []).filter((e) => e.is_active !== false),
      );

      const activeGroups = (groupsRes.data || []).filter(
        (g) => g.is_active !== false,
      );
      setProductCategories(activeGroups);

      setAppointmentServices(
        (servicesRes.data || []).filter((p) => p.is_active !== false),
      );
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    }
  };

  const handleSelectProductGroup = async (groupId) => {
    setSelectedCategory(groupId);
    setProductsLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/products?group_id=${groupId}&active=true`,
      );
      setProducts((res.data || []).filter((p) => p.is_active !== false));
    } catch (err) {
      console.error("Grup ürünleri çekilemedi:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleCellClick = (room, hour) => {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      alert("Geçmiş günlere yeni rezervasyon ekleyemezsiniz!");
      return;
    }

    setSelectedCell({ room, hour });
    setFormData({
      customer_id: "",
      new_customer_name: "",
      service_id: "",
      employee_id: "",
      duration_minutes: 60,
      guest_count: 1,
      notes: "",
    });
    setError("");
    setActiveModal("new");
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;

    const selectedService = appointmentServices.find(
      (s) => String(s.id) === String(serviceId),
    );

    setFormData((prev) => ({
      ...prev,
      service_id: serviceId,
      duration_minutes:
        selectedService?.duration_minutes || prev.duration_minutes || 60,
    }));
  };

  const handleAppClick = async (app, e) => {
    e.stopPropagation();
    setSelectedApp(app);
    setError("");
    setSelectedCategory(null);
    setProducts([]);

    try {
      const ordersRes = await axios.get(
        `http://localhost:5000/api/room-orders/${app.id}`,
      );
      setCurrentOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Adisyon çekilemedi:", err);
      setCurrentOrders([]);
    }

    setActiveModal("detail");
  };

  const handleNewReservationSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (parseInt(formData.guest_count) > selectedCell.room.capacity) {
      setError(
        `Bu odanın maksimum kapasitesi ${selectedCell.room.capacity} kişidir!`,
      );
      return;
    }

    const start_time = `${selectedDate}T${selectedCell.hour}:00`;

    try {
      await axios.post("http://localhost:5000/api/room-appointments", {
        room_id: selectedCell.room.id,
        customer_id: isNewCustomer ? null : formData.customer_id,
        new_customer_name: isNewCustomer ? formData.new_customer_name : null,
        service_id: formData.service_id,
        employee_id: formData.employee_id || null,
        start_time,
        duration_minutes: parseInt(formData.duration_minutes),
        guest_count: parseInt(formData.guest_count),
        notes: formData.notes,
      });

      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      setError(err.response?.data?.error || "Giriş kaydedilemedi.");
    }
  };

  const handleDeleteReservation = async (possibleId) => {
    if (!selectedApp) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appDate = new Date(selectedApp.appointment_date || selectedApp.date);
    appDate.setHours(0, 0, 0, 0);

    if (appDate < today) {
      alert("Geçmiş günlere ait rezervasyonlar silinemez!");
      return;
    }

    if (!window.confirm("Bu rezervasyonu silmek istediğinize emin misiniz?"))
      return;

    let appId =
      possibleId && typeof possibleId !== "object"
        ? possibleId
        : selectedApp.room_appointment_id ||
          selectedApp.id ||
          selectedApp.appointment_id;

    if (!appId) {
      alert("Silinecek oda rezervasyon ID'si bulunamadı!");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/room-appointments/${appId}`,
      );

      alert("Oda rezervasyonu başarıyla silindi.");
      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      console.error("Silme hatası:", err);
      alert(
        "Silme işlemi başarısız oldu: " +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            err.message),
      );
    }
  };

  const handleAddProductTemp = (product) => {
    const price = parseFloat(product.price) || 0;
    const newOrderItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: price,
      total_price: price,
      currency: product.currency || product.currency_code || "TRY",
    };

    setCurrentOrders((prev) => [...prev, newOrderItem]);
  };

  const handleRemoveProductTemp = (indexToRemove) => {
    setCurrentOrders((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  const handleSaveOrders = async () => {
    if (!selectedApp) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appDate = new Date(selectedApp.appointment_date || selectedApp.date);
    appDate.setHours(0, 0, 0, 0);

    if (appDate < today) {
      alert(
        "Geçmiş günlere ait rezervasyonlarda adisyon değişikliği veya kaydı yapamazsınız!",
      );
      return;
    }

    try {
      setIsSaving(true);
      await axios.post("http://localhost:5000/api/room-orders/bulk-save", {
        room_appointment_id: selectedApp.id,
        orders: currentOrders,
      });

      alert("Adisyon başarıyla kaydedildi!");
      setActiveModal(null);
      fetchMatrixData();
    } catch (err) {
      console.error(err);
      alert(
        "Adisyon kaydedilirken hata oluştu: " +
          (err.response?.data?.error || err.message),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const findAppointment = (roomId, hour) => {
    const [targetHour] = hour.split(":").map(Number);
    const targetTime = targetHour * 60;
    return appointments.find((app) => {
      if (app.room_id !== roomId) return false;
      const appDate = new Date(app.start_time);
      const appStart = appDate.getHours() * 60 + appDate.getMinutes();
      const appEnd = appStart + (app.duration_minutes || 60);
      return targetTime >= appStart && targetTime < appEnd;
    });
  };

  const isContinuation = (roomId, hour) => {
    const [targetHour] = hour.split(":").map(Number);
    const targetTime = targetHour * 60;
    return appointments.some((app) => {
      if (app.room_id !== roomId) return false;
      const appDate = new Date(app.start_time);
      const appStart = appDate.getHours() * 60 + appDate.getMinutes();
      const appDuration = app.duration_minutes || 60;
      return targetTime > appStart && targetTime < appStart + appDuration;
    });
  };

  return (
    <div>
      <PageHeader
        icon={Clock}
        title="Günlük Oda & Saat Bazlı Takip"
        subtitle="Odaları saat dilimine göre izleyin, rezervasyon ve adisyon yönetin."
        actions={
          <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tarih
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 bg-transparent text-sm font-medium text-slate-800 outline-none dark:text-slate-100"
            />
          </label>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-md backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40">
        <table className="w-full min-w-[1100px] border-separate border-spacing-1 text-center">
          <thead>
            <tr>
              <th className="w-40 rounded-lg bg-slate-900 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-200 dark:bg-slate-800">
                Oda / Saat
              </th>
              {HOURS.map((h) => (
                <th
                  key={h}
                  className="rounded-lg bg-slate-800 px-1 py-2.5 text-[11px] font-medium text-slate-200 dark:bg-slate-800/90"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {room.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kapasite: {room.capacity} Kişi
                  </div>
                </td>
                {HOURS.map((hour) => {
                  if (isContinuation(room.id, hour)) {
                    return null;
                  }

                  const app = findAppointment(room.id, hour);
                  const colSpan = app
                    ? Math.ceil((app.duration_minutes || 60) / 60)
                    : 1;
                  const tone =
                    bookingTones[(app?.id || 0) % bookingTones.length];

                  return (
                    <td
                      key={hour}
                      colSpan={colSpan}
                      onClick={() => !app && handleCellClick(room, hour)}
                      className={cn(
                        "h-16 rounded-lg border p-1 align-middle",
                        app
                          ? "border-transparent"
                          : "cursor-pointer border-slate-200 bg-slate-50/80 transition hover:border-amber-300 hover:bg-amber-50/70 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10",
                      )}
                    >
                      {app ? (
                        <button
                          type="button"
                          onClick={(e) => handleAppClick(app, e)}
                          className={cn(
                            "flex h-full w-full flex-col items-center justify-center rounded-lg border px-2 py-1 text-[11px] leading-tight",
                            tone,
                          )}
                        >
                          <strong className="truncate font-semibold">
                            {app.customer_fullname}
                          </strong>
                          <span className="truncate opacity-90">
                            {app.service_name}
                          </span>
                          <span className="opacity-75">
                            {app.guest_count} Kişi · {app.duration_minutes} dk
                          </span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center justify-center text-slate-300 dark:text-slate-600">
                          <Plus size={14} />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeModal === "new" && selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className={cn(cardClass, "w-full max-w-md p-6")}>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-slate-100">
              Yeni Rezervasyon — {selectedCell.room.name} / {selectedCell.hour}
            </h3>
            <Alert type="error">{error}</Alert>
            <form
              onSubmit={handleNewReservationSubmit}
              className="flex flex-col gap-3"
            >
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isNewCustomer}
                  onChange={(e) => setIsNewCustomer(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                Yeni misafir girişi
              </label>

              {isNewCustomer ? (
                <div>
                  <label className={labelClass}>Misafir Adı Soyadı</label>
                  <input
                    required
                    value={formData.new_customer_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        new_customer_name: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              ) : (
                <div>
                  <label className={labelClass}>Kayıtlı Misafir</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        customer_id: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  >
                    <option value="">-- Misafir Seçin --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                        {c.phone ? ` (${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Hizmet</label>
                <select
                  required
                  value={formData.service_id}
                  onChange={handleServiceChange}
                  className={fieldClass}
                >
                  <option value="">-- Hizmet Seçin --</option>
                  {appointmentServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatCurrency(s.price, s.currency || s.currency_code)}
                      {s.duration_minutes ? ` (${s.duration_minutes} dk)` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Personel</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      employee_id: e.target.value,
                    }))
                  }
                  className={fieldClass}
                >
                  <option value="">-- Personel (isteğe bağlı) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name ||
                        `${emp.first_name || ""} ${emp.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Süre (dk)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration_minutes: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Kişi sayısı</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.guest_count}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        guest_count: e.target.value,
                      }))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Not</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                  className={fieldClass}
                />
              </div>

              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className={btnSecondary}
                >
                  İptal
                </button>
                <button type="submit" className={btnPrimary}>
                  <Save size={15} /> Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "detail" &&
        selectedApp &&
        (() => {
          const appDate = new Date(selectedApp.start_time);
          appDate.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isPastAppointment = appDate < today;

          const servicePrice = parseFloat(
            selectedApp.service_price || selectedApp.price || 0,
          );
          const serviceCurrency =
            selectedApp.service_currency ||
            selectedApp.currency ||
            selectedApp.currency_code ||
            "TRY";
          const extrasByCurrency = totalsByCurrency(currentOrders);
          const localBreakdown = sumItemsToTry(
            [
              {
                total_price: servicePrice,
                currency: serviceCurrency,
              },
              ...currentOrders,
            ],
            exchangeRates,
          );

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
              <div
                className={cn(
                  cardClass,
                  "w-full max-w-[1100px] p-6",
                )}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Oda Adisyon & Hizmet Paneli ({selectedApp.room_name})
                  </h3>
                  {isPastAppointment && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25">
                      <Lock size={12} /> Geçmiş Kayıt
                    </span>
                  )}
                </div>

                <div className="grid h-[480px] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr_340px]">
                  <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <div className="mb-3 flex flex-wrap gap-1.5 border-b border-slate-200 pb-3 dark:border-slate-700">
                      {productCategories.length === 0 ? (
                        <div className="py-2 text-xs text-slate-500">
                          Aktif ürün grubu yok.
                        </div>
                      ) : (
                        productCategories.map((cat) => {
                          const selected =
                            String(selectedCategory) === String(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => handleSelectProductGroup(cat.id)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                selected
                                  ? "bg-slate-900 text-white shadow-sm dark:bg-amber-600"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                              )}
                            >
                              {cat.name}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
                      {productsLoading ? (
                        <div className="mt-6 text-center text-xs text-slate-500">
                          Ürünler yükleniyor...
                        </div>
                      ) : !selectedCategory ? (
                        <div className="mt-6 text-center text-xs text-slate-500">
                          Ürünleri görmek için bir grup seçin.
                        </div>
                      ) : products.length === 0 ? (
                        <div className="mt-6 text-center text-xs text-slate-500">
                          Bu grupta aktif ürün bulunamadı.
                        </div>
                      ) : (
                        products.map((prod) => (
                          <button
                            key={prod.id}
                            onClick={() => handleAddProductTemp(prod)}
                            disabled={isPastAppointment}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-amber-500/40 dark:hover:bg-slate-800"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-100">
                              {prod.name}
                            </span>
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(
                                prod.price,
                                prod.currency || prod.currency_code,
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                    <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Rezervasyon Bilgileri
                    </h4>
                    <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                      <p>
                        <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                          Oda
                        </span>
                        {selectedApp.room_name}
                      </p>
                      <p>
                        <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                          Personel
                        </span>
                        {selectedApp.employee_fullname || "Atanmadı"}
                      </p>
                      <p>
                        <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                          Müşteri
                        </span>
                        {selectedApp.customer_fullname || "Bilinmiyor"}
                      </p>
                      <p>
                        <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                          Hizmet
                        </span>
                        {selectedApp.service_name ||
                          selectedApp.product_name ||
                          selectedApp.service ||
                          "Seçilmedi"}
                        {servicePrice
                          ? ` · ${formatCurrency(servicePrice, serviceCurrency)}`
                          : ""}
                      </p>
                      <p>
                        <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                          Kişi
                        </span>
                        {selectedApp.guest_count} Kişi
                      </p>
                      {selectedApp.notes && (
                        <p className="text-slate-500 dark:text-slate-400">
                          <span className="mr-2 text-xs uppercase tracking-wide text-slate-400">
                            Not
                          </span>
                          {selectedApp.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                    <h4 className="mb-3 border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Adisyon / Siparişler
                    </h4>

                    <div className="mb-3 flex max-h-[250px] flex-1 flex-col gap-1.5 overflow-y-auto">
                      {currentOrders.length === 0 ? (
                        <div className="mt-6 text-center text-xs text-slate-500">
                          Henüz sipariş eklenmedi.
                        </div>
                      ) : (
                        currentOrders.map((order, index) => (
                          <div
                            key={order.id || index}
                            className="flex items-center justify-between border-b border-dashed border-slate-200 py-2 text-sm dark:border-slate-700"
                          >
                            <span className="text-slate-700 dark:text-slate-200">
                              {order.quantity || 1}x{" "}
                              {order.product_name || order.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {formatCurrency(
                                  order.total_price,
                                  order.currency || order.currency_code,
                                )}
                              </span>
                              {!isPastAppointment && (
                                <button
                                  onClick={() => handleRemoveProductTemp(index)}
                                  className="rounded-md p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Ürünü Adisyondan Çıkar"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                        <span>Hizmet Bedeli</span>
                        <span>{formatCurrency(servicePrice, serviceCurrency)}</span>
                      </div>
                      <div className="mt-1 flex justify-between gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <span>Ekstralar</span>
                        <span className="text-right">
                          {formatMixedTotals(extrasByCurrency)}
                        </span>
                      </div>
                      <div className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 dark:border-amber-500/20 dark:bg-amber-500/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                              Yerel Tutar (TL Karşılığı)
                            </div>
                            {exchangeDate && (
                              <div className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-300/80">
                                TCMB kur tarihi:{" "}
                                {new Date(exchangeDate).toLocaleDateString("tr-TR")}
                              </div>
                            )}
                          </div>
                          <span className="text-base font-semibold text-amber-900 dark:text-amber-200">
                            {localBreakdown.missing
                              ? "Kur bekleniyor"
                              : formatCurrency(localBreakdown.total, "TRY")}
                          </span>
                        </div>
                      </div>

                      {!isPastAppointment && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={handleSaveOrders}
                            disabled={isSaving}
                            className={cn(btnSuccess, "flex-1")}
                          >
                            <Save size={15} />
                            {isSaving ? "Kaydediliyor..." : "Kaydet"}
                          </button>
                          <button
                            onClick={() => setActiveModal(null)}
                            className={cn(btnSecondary, "flex-1")}
                          >
                            Kapat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {!isPastAppointment && (
                    <button
                      onClick={() => handleDeleteReservation()}
                      className={btnDelete}
                    >
                      <Trash2 size={14} /> Rezervasyonu İptal Et
                    </button>
                  )}

                  {isPastAppointment && (
                    <button
                      onClick={() => setActiveModal(null)}
                      className={btnSecondary}
                    >
                      Kapat
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default RoomGridMatrix;
