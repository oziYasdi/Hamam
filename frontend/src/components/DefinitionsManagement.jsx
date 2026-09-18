import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Layers,
  Package,
  Briefcase,
  DoorOpen,
  Coins,
  Users,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import EmployeeManagement from "./EmployeeManagement";
import {
  Alert,
  PageHeader,
  SoftBadge,
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
import { formatCurrency } from "../currency.js";

const DefinitionsManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState("product-groups");

  const [productGroups, setProductGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProfId, setEditingProfId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);

  const [groupForm, setGroupForm] = useState({
    name: "",
    display_order: 0,
    is_active: true,
    is_appointment_service: false,
  });

  const [productForm, setProductForm] = useState({
    group_id: "",
    name: "",
    price: "",
    currency: "TRY",
    duration_minutes: "",
    is_active: true,
  });
  const [profForm, setProfForm] = useState({ name: "", display_order: 0 });
  const [roomForm, setRoomForm] = useState({
    name: "",
    capacity: 1,
    display_order: 0,
  });
  const [currForm, setCurrForm] = useState({
    code: "",
    name: "",
    symbol: "",
    exchange_rate: 1.0,
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  const fetchAllData = async () => {
    try {
      const [groupsRes, prodsRes, profsRes, roomsRes, currsRes] =
        await Promise.allSettled([
          axios.get("http://localhost:5000/api/product-groups"),
          axios.get("http://localhost:5000/api/products"),
          axios.get("http://localhost:5000/api/professions"),
          axios.get("http://localhost:5000/api/rooms"),
          axios.get("http://localhost:5000/api/currencies"),
        ]);

      if (groupsRes.status === "fulfilled")
        setProductGroups(groupsRes.value.data);
      if (prodsRes.status === "fulfilled") setProducts(prodsRes.value.data);
      if (profsRes.status === "fulfilled") setProfessions(profsRes.value.data);
      if (roomsRes.status === "fulfilled") setRooms(roomsRes.value.data);
      if (currsRes.status === "fulfilled") setCurrencies(currsRes.value.data);
    } catch (err) {
      console.error("Tanım verileri çekilemedi:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editingGroupId) {
        await axios.put(
          `http://localhost:5000/api/product-groups/${editingGroupId}`,
          groupForm,
        );
        showMsg("Ürün grubu güncellendi.");
      } else {
        await axios.post("http://localhost:5000/api/product-groups", groupForm);
        showMsg("Ürün grubu eklendi.");
      }
      resetGroupForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "İşlem başarısız.", "error");
    }
  };

  const handleEditGroupClick = (group) => {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      display_order: group.display_order || 0,
      is_active: group.is_active ?? true,
      is_appointment_service: group.is_appointment_service ?? false,
    });
  };
  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Bu ürün grubunu silmek istediğinizden emin misiniz?"))
      return;
    try {
      await axios.delete(`http://localhost:5000/api/product-groups/${id}`);
      showMsg("Ürün grubu silindi.");
      if (editingGroupId === id) resetGroupForm();
      fetchAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.error || "Silme başarısız. Bağlı ürünler olabilir.",
        "error",
      );
    }
  };
  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm({
      name: "",
      display_order: 0,
      is_active: true,
      is_appointment_service: false,
    });
  };
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await axios.put(
          `http://localhost:5000/api/products/${editingProductId}`,
          productForm,
        );
        showMsg("Ürün başarıyla güncellendi.");
      } else {
        await axios.post("http://localhost:5000/api/products", productForm);
        showMsg("Ürün başarıyla eklendi.");
      }
      resetProductForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "İşlem başarısız.", "error");
    }
  };

  const handleEditProductClick = (prod) => {
    setEditingProductId(prod.id);
    setProductForm({
      group_id: prod.group_id || "",
      name: prod.name,
      price: prod.price,
      currency: prod.currency || "TRY",
      duration_minutes: prod.duration_minutes || "",
      is_active: prod.is_active ?? true,
    });
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      showMsg("Ürün silindi.");
      if (editingProductId === id) resetProductForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "Silme başarısız.", "error");
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      group_id: "",
      name: "",
      price: "",
      currency: "TRY",
      duration_minutes: "",
      is_active: true,
    });
  };

  const handleSaveProf = async (e) => {
    e.preventDefault();
    try {
      if (editingProfId) {
        await axios.put(
          `http://localhost:5000/api/professions/${editingProfId}`,
          profForm,
        );
        showMsg("Meslek tanımı güncellendi.");
      } else {
        await axios.post("http://localhost:5000/api/professions", profForm);
        showMsg("Meslek tanımı eklendi.");
      }
      resetProfForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "İşlem başarısız.", "error");
    }
  };

  const handleEditProfClick = (prof) => {
    setEditingProfId(prof.id);
    setProfForm({ name: prof.name, display_order: prof.display_order || 0 });
  };

  const handleDeleteProf = async (id) => {
    if (
      !window.confirm("Bu meslek tanımını silmek istediğinizden emin misiniz?")
    )
      return;
    try {
      await axios.delete(`http://localhost:5000/api/professions/${id}`);
      showMsg("Meslek tanımı silindi.");
      if (editingProfId === id) resetProfForm();
      fetchAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.error ||
          "Silme başarısız. Bağlı personel kayıtları olabilir.",
        "error",
      );
    }
  };

  const resetProfForm = () => {
    setEditingProfId(null);
    setProfForm({ name: "", display_order: 0 });
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoomId) {
        await axios.put(
          `http://localhost:5000/api/rooms/${editingRoomId}`,
          roomForm,
        );
        showMsg("Oda tanımı başarıyla güncellendi.");
      } else {
        await axios.post("http://localhost:5000/api/rooms", roomForm);
        showMsg("Oda tanımı eklendi.");
      }
      resetRoomForm();
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "Oda işlemi başarısız.", "error");
    }
  };

  const handleEditRoomClick = (room) => {
    setEditingRoomId(room.id);
    setRoomForm({
      name: room.name,
      capacity: room.capacity || 1,
      display_order: room.display_order || 0,
      is_active: room.is_active ?? true,
    });
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Bu odayı silmek istediğinizden emin misiniz?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/rooms/${id}`);
      showMsg("Oda tanımı silindi.");
      if (editingRoomId === id) resetRoomForm();
      fetchAllData();
    } catch (err) {
      showMsg(
        err.response?.data?.error ||
          "Silme başarısız. Bu odada yapılmış randevular bulunabilir.",
        "error",
      );
    }
  };

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setRoomForm({ name: "", capacity: 1, display_order: 0, is_active: true });
  };

  const handleAddCurr = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/currencies", currForm);
      showMsg("Döviz tanımı eklendi.");
      setCurrForm({ code: "", name: "", symbol: "", exchange_rate: 1.0 });
      fetchAllData();
    } catch (err) {
      showMsg(err.response?.data?.error || "Döviz eklenemedi.", "error");
    }
  };

  const tabs = [
    { id: "product-groups", label: "Ürün Grupları", icon: Layers },
    { id: "products", label: "Ürün Tanımları", icon: Package },
    { id: "professions", label: "Meslek Tanımları", icon: Briefcase },
    { id: "employees", label: "Personel Tanımları", icon: Users },
    { id: "rooms", label: "Oda Tanımları", icon: DoorOpen },
    { id: "currencies", label: "Döviz Tanımları", icon: Coins },
  ];

  const FormActions = ({ editing, onCancel }) => (
    <div className="mt-2 flex gap-2">
      <button
        type="submit"
        className={cn(editing ? btnSuccess : btnPrimary, "flex-1")}
      >
        {editing ? "Güncelle" : "Kaydet"}
      </button>
      {editing && (
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Vazgeç
        </button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        icon={Layers}
        title="Sistem Tanımları"
        subtitle="Ürün, oda, personel ve döviz kayıtlarını yönetin."
      />

      <Alert type={message.type}>{message.text}</Alert>

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-full border border-slate-200/80 bg-white/70 p-1 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm dark:bg-amber-600"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              )}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === "product-groups" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSaveGroup} className={cardClass}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {editingGroupId ? <RefreshCw size={18} /> : <Plus size={18} />}
              {editingGroupId ? "Grup Düzenle" : "Yeni Ürün Grubu"}
            </h3>
            <div className="mb-3">
              <label className={labelClass}>Grup Adı</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) =>
                  setGroupForm({ ...groupForm, name: e.target.value })
                }
                required
                className={fieldClass}
                placeholder="Örn: Masaj Çeşitleri"
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Sıra No</label>
              <input
                type="number"
                value={groupForm.display_order}
                onChange={(e) =>
                  setGroupForm({
                    ...groupForm,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                className={fieldClass}
              />
            </div>
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                id="grp_appointment_service"
                checked={groupForm.is_appointment_service || false}
                onChange={(e) =>
                  setGroupForm({
                    ...groupForm,
                    is_appointment_service: e.target.checked,
                  })
                }
                className="rounded border-slate-300 text-amber-600"
              />
              Randevu hizmeti olarak gösterilsin
            </label>
            {editingGroupId && (
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  id="grp_active"
                  checked={groupForm.is_active}
                  onChange={(e) =>
                    setGroupForm({ ...groupForm, is_active: e.target.checked })
                  }
                  className="rounded border-slate-300 text-amber-600"
                />
                Aktif durumda
              </label>
            )}
            <FormActions editing={editingGroupId} onCancel={resetGroupForm} />
          </form>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Sıra</th>
                  <th className={thClass}>Grup Adı</th>
                  <th className={thClass}>Randevu Hizmeti</th>
                  <th className={thClass}>Durum</th>
                  <th className={thClass}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {productGroups.map((g, i) => (
                  <tr
                    key={g.id}
                    className={cn(
                      "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                    )}
                  >
                    <td className={tdClass}>{g.display_order}</td>
                    <td className={cn(tdClass, "font-medium")}>{g.name}</td>
                    <td className={tdClass}>
                      <SoftBadge tone={g.is_appointment_service ? "sky" : "slate"}>
                        {g.is_appointment_service ? "Evet" : "Hayır"}
                      </SoftBadge>
                    </td>
                    <td className={tdClass}>
                      <StatusBadge active={g.is_active} />
                    </td>
                    <td className={cn(tdClass, "flex gap-2")}>
                      <button
                        onClick={() => handleEditGroupClick(g)}
                        className={btnEdit}
                      >
                        <Edit2 size={14} /> Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(g.id)}
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
      )}

      {activeSubTab === "products" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSaveProduct} className={cardClass}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {editingProductId ? <RefreshCw size={18} /> : <Plus size={18} />}
              {editingProductId ? "Ürün / Hizmet Düzenle" : "Yeni Ürün / Hizmet"}
            </h3>
            <div className="mb-3">
              <label className={labelClass}>Ürün Grubu</label>
              <select
                value={productForm.group_id}
                onChange={(e) =>
                  setProductForm({ ...productForm, group_id: e.target.value })
                }
                required
                className={fieldClass}
              >
                <option value="">-- Grup Seçin --</option>
                {productGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className={labelClass}>Ürün / Hizmet Adı</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
                className={fieldClass}
                placeholder="Örn: Klasik Masaj"
              />
            </div>
            <div className="mb-3 grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Fiyat</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  required
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Para Birimi</label>
                <select
                  value={productForm.currency}
                  onChange={(e) =>
                    setProductForm({ ...productForm, currency: e.target.value })
                  }
                  className={fieldClass}
                >
                  {currencies.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className={labelClass}>Süre (dakika, isteğe bağlı)</label>
              <input
                type="number"
                value={productForm.duration_minutes || ""}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    duration_minutes: e.target.value,
                  })
                }
                placeholder="Örn: 45"
                className={fieldClass}
              />
            </div>
            {editingProductId && (
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  id="prod_active"
                  checked={productForm.is_active}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      is_active: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-amber-600"
                />
                Aktif satışta
              </label>
            )}
            <FormActions
              editing={editingProductId}
              onCancel={resetProductForm}
            />
          </form>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Grup</th>
                  <th className={thClass}>Ürün / Hizmet Adı</th>
                  <th className={thClass}>Fiyat</th>
                  <th className={thClass}>Süre</th>
                  <th className={thClass}>Durum</th>
                  <th className={thClass}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Henüz tanımlanmış ürün bulunamadı.
                    </td>
                  </tr>
                ) : (
                  products.map((p, i) => {
                    const group = productGroups.find((g) => g.id === p.group_id);
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                          i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                        )}
                      >
                        <td className={tdClass}>
                          {group ? group.name : p.group_name || "-"}
                        </td>
                        <td className={cn(tdClass, "font-medium")}>{p.name}</td>
                        <td className={tdClass}>
                          {formatCurrency(p.price, p.currency || p.currency_code)}
                        </td>
                        <td className={tdClass}>
                          {p.duration_minutes
                            ? `${p.duration_minutes} dk`
                            : "-"}
                        </td>
                        <td className={tdClass}>
                          <StatusBadge active={p.is_active} />
                        </td>
                        <td className={cn(tdClass, "flex gap-2")}>
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className={btnEdit}
                          >
                            <Edit2 size={14} /> Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className={btnDelete}
                          >
                            <Trash2 size={14} /> Sil
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "professions" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSaveProf} className={cardClass}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {editingProfId ? <RefreshCw size={18} /> : <Plus size={18} />}
              {editingProfId ? "Meslek Düzenle" : "Yeni Meslek Tanımı"}
            </h3>
            <div className="mb-3">
              <label className={labelClass}>Meslek Adı</label>
              <input
                type="text"
                value={profForm.name}
                onChange={(e) =>
                  setProfForm({ ...profForm, name: e.target.value })
                }
                required
                className={fieldClass}
                placeholder="Örn: Tellak, Masör"
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Sıra No</label>
              <input
                type="number"
                value={profForm.display_order}
                onChange={(e) =>
                  setProfForm({
                    ...profForm,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                className={fieldClass}
              />
            </div>
            <FormActions editing={editingProfId} onCancel={resetProfForm} />
          </form>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Sıra</th>
                  <th className={thClass}>Meslek Unvanı</th>
                  <th className={thClass}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {professions.map((pr, i) => (
                  <tr
                    key={pr.id}
                    className={cn(
                      "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                    )}
                  >
                    <td className={tdClass}>{pr.display_order}</td>
                    <td className={cn(tdClass, "font-medium")}>{pr.name}</td>
                    <td className={cn(tdClass, "flex gap-2")}>
                      <button
                        onClick={() => handleEditProfClick(pr)}
                        className={btnEdit}
                      >
                        <Edit2 size={14} /> Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteProf(pr.id)}
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
      )}

      {activeSubTab === "employees" && <EmployeeManagement />}

      {activeSubTab === "rooms" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleSaveRoom} className={cardClass}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {editingRoomId ? <RefreshCw size={18} /> : <Plus size={18} />}
              {editingRoomId ? "Oda Düzenle" : "Yeni Oda Tanımı"}
            </h3>
            <div className="mb-3">
              <label className={labelClass}>Oda / Alan Adı</label>
              <input
                type="text"
                value={roomForm.name}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, name: e.target.value })
                }
                required
                className={fieldClass}
                placeholder="Örn: VIP Masaj Odası 1"
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Kapasite (Kişi)</label>
              <input
                type="number"
                min="1"
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    capacity: parseInt(e.target.value) || 1,
                  })
                }
                required
                className={fieldClass}
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Sıra No</label>
              <input
                type="number"
                value={roomForm.display_order}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                className={fieldClass}
              />
            </div>
            {editingRoomId && (
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  id="room_active"
                  checked={roomForm.is_active}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, is_active: e.target.checked })
                  }
                  className="rounded border-slate-300 text-amber-600"
                />
                Aktif durumda
              </label>
            )}
            <FormActions editing={editingRoomId} onCancel={resetRoomForm} />
          </form>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Sıra</th>
                  <th className={thClass}>Oda Adı</th>
                  <th className={thClass}>Kapasite</th>
                  <th className={thClass}>Durum</th>
                  <th className={thClass}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((rm, i) => (
                  <tr
                    key={rm.id}
                    className={cn(
                      "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                    )}
                  >
                    <td className={tdClass}>{rm.display_order}</td>
                    <td className={cn(tdClass, "font-medium")}>{rm.name}</td>
                    <td className={tdClass}>{rm.capacity} Kişilik</td>
                    <td className={tdClass}>
                      <StatusBadge active={rm.is_active} />
                    </td>
                    <td className={cn(tdClass, "flex gap-2")}>
                      <button
                        onClick={() => handleEditRoomClick(rm)}
                        className={btnEdit}
                      >
                        <Edit2 size={14} /> Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(rm.id)}
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
      )}

      {activeSubTab === "currencies" && (
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleAddCurr} className={cardClass}>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
              <Plus size={18} /> Yeni Döviz Tanımı
            </h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Kurlar TCMB bültenine göre her gün otomatik güncellenir. İsterseniz
              anlık senkron da çalıştırabilirsiniz.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.post("http://localhost:5000/api/exchange-rates/sync");
                  showMsg("TCMB kurları güncellendi.");
                  fetchAllData();
                } catch (err) {
                  showMsg(
                    err.response?.data?.error || "Kurlar güncellenemedi.",
                    "error",
                  );
                }
              }}
              className={cn(btnSecondary, "mb-4 w-full")}
            >
              <RefreshCw size={15} /> TCMB Kurlarını Güncelle
            </button>
            <div className="mb-3">
              <label className={labelClass}>Döviz Kodu (USD, EUR)</label>
              <input
                type="text"
                value={currForm.code}
                onChange={(e) =>
                  setCurrForm({
                    ...currForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
                required
                className={fieldClass}
                placeholder="Örn: EUR"
              />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Tanım / Adı</label>
              <input
                type="text"
                value={currForm.name}
                onChange={(e) =>
                  setCurrForm({ ...currForm, name: e.target.value })
                }
                required
                className={fieldClass}
                placeholder="Örn: Euro"
              />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sembol</label>
                <input
                  type="text"
                  value={currForm.symbol}
                  onChange={(e) =>
                    setCurrForm({ ...currForm, symbol: e.target.value })
                  }
                  required
                  className={fieldClass}
                  placeholder="Örn: €"
                />
              </div>
              <div>
                <label className={labelClass}>Başlangıç Kuru (TRY)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={currForm.exchange_rate}
                  onChange={(e) =>
                    setCurrForm({
                      ...currForm,
                      exchange_rate: parseFloat(e.target.value) || 1,
                    })
                  }
                  className={fieldClass}
                />
              </div>
            </div>
            <button type="submit" className={cn(btnPrimary, "w-full")}>
              Kaydet
            </button>
          </form>

          <div className={tableWrap}>
            <table className="w-full text-left">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60">
                <tr>
                  <th className={thClass}>Kod</th>
                  <th className={thClass}>Döviz Adı</th>
                  <th className={thClass}>Sembol</th>
                  <th className={thClass}>Güncel Kur (TRY)</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c, i) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-t border-slate-100 transition hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-800/40",
                      i % 2 === 1 && "bg-slate-50/50 dark:bg-slate-900/30",
                    )}
                  >
                    <td className={cn(tdClass, "font-medium")}>{c.code}</td>
                    <td className={tdClass}>{c.name}</td>
                    <td className={tdClass}>{c.symbol}</td>
                    <td className={cn(tdClass, "font-semibold")}>
                      {formatCurrency(c.live_rate || c.exchange_rate, "TRY")}
                      {c.rate_date && (
                        <div className="text-[11px] font-normal text-slate-400">
                          {new Date(c.rate_date).toLocaleDateString("tr-TR")}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefinitionsManagement;
