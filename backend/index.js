const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Test API Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hamam Takip Sistemi API Çalışıyor!' });
});

// --- MÜŞTERİ API ROTALARI ---

// 1. Tüm Müşterileri Listele (GET)
// --- CUSTOMERS (MÜŞTERİLER) ROTASI ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(customers.rows);
  } catch (err) {
    console.error('Müşteri Çekme Hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});



// 2. Yeni Müşteri Ekle (POST)
app.post('/api/customers', async (req, res) => {
  try {
    const { first_name, last_name, phone, gender, notes } = req.body;

    const existing = await db.query('SELECT * FROM customers WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu telefon numarasıyla kayıtlı bir müşteri zaten var.' });
    }

    const newCustomer = await db.query(
      'INSERT INTO customers (first_name, last_name, phone, gender, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [first_name, last_name, phone, gender, notes]
    );

    res.status(201).json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Müşteri eklenirken sunucu hatası oluştu.' });
  }
});



// --- ÜRÜN GRUP TANIMLARI API ROTALARI ---

// 1. Tüm Ürün Gruplarını Listele (GET)
app.get('/api/product-groups', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM product_groups ORDER BY display_order ASC, id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grupları alınırken hata oluştu.' });
  }
});

// 2. Yeni Ürün Grubu Ekle (POST)
app.post('/api/product-groups', async (req, res) => {
  try {
    const { name, display_order } = req.body;
    const newGroup = await db.query(
      'INSERT INTO product_groups (name, display_order) VALUES ($1, $2) RETURNING *',
      [name, display_order || 0]
    );
    res.status(201).json(newGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grubu eklenirken hata oluştu.' });
  }
});


// 3. Ürün Grubunu Güncelle (PUT)
app.put('/api/product-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, is_active } = req.body;

    const updatedGroup = await db.query(
      'UPDATE product_groups SET name = $1, display_order = $2, is_active = $3 WHERE id = $4 RETURNING *',
      [name, display_order || 0, is_active ?? true, id]
    );

    if (updatedGroup.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün grubu bulunamadı.' });
    }

    res.json(updatedGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grubu güncellenirken hata oluştu.' });
  }
});

// 4. Ürün Grubunu Sil (DELETE)
app.delete('/api/product-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedGroup = await db.query(
      'DELETE FROM product_groups WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedGroup.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün grubu bulunamadı.' });
    }

    res.json({ message: 'Ürün grubu başarıyla silindi.', group: deletedGroup.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grubu silinirken hata oluştu. Bağlı ürünler olabilir.' });
  }
});





// --- ÜRÜN TANIMLARI API ROTALARI ---

// 1. Tüm Ürünleri Bağlı Olduğu Grup Adıyla Listele (GET)
app.get('/api/products', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        p.*, 
        pg.name AS group_name 
      FROM products p
      LEFT JOIN product_groups pg ON p.group_id = pg.id
      ORDER BY p.id DESC
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürünler alınırken hata oluştu.' });
  }
});

// 2. Yeni Ürün Ekle (POST)
app.post('/api/products', async (req, res) => {
  try {
    const { group_id, name, price, currency, duration_minutes } = req.body;
    const newProduct = await db.query(
      'INSERT INTO products (group_id, name, price, currency, duration_minutes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [group_id || null, name, price, currency || 'TRY', duration_minutes || null]
    );
    res.status(201).json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün eklenirken hata oluştu.' });
  }
});


// --- 1. HİZMETLERİ GETİR ---
app.get('/api/services', async (req, res) => {
  try {
    const services = await db.query('SELECT * FROM services WHERE is_active = true ORDER BY name ASC');
    res.json(services.rows);
  } catch (err) {
    console.error('Hizmetler Çekilirken Hata:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Ürün/Hizmet Güncelle (PUT)
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id, name, price, currency, duration_minutes, is_active } = req.body;

    const updatedProduct = await db.query(
      `UPDATE products 
       SET group_id = $1, name = $2, price = $3, currency = $4, duration_minutes = $5, is_active = $6 
       WHERE id = $7 RETURNING *`,
      [group_id || null, name, price, currency || 'TRY', duration_minutes || null, is_active ?? true, id]
    );

    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    res.json(updatedProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün güncellenirken hata oluştu.' });
  }
});

// 4. Ürün/Hizmet Sil (DELETE)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    res.json({ message: 'Ürün başarıyla silindi.', product: deletedProduct.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün silinirken hata oluştu.' });
  }
});






// --- MESLEK TANIMLARI API ROTALARI ---

// 1. Tüm Meslekleri Listele (GET)
app.get('/api/professions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM professions ORDER BY display_order ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Meslek tanımları alınırken hata oluştu.' });
  }
});

// 2. Yeni Meslek Ekle (POST)
app.post('/api/professions', async (req, res) => {
  try {
    const { name, display_order } = req.body;
    const newProf = await db.query(
      'INSERT INTO professions (name, display_order) VALUES ($1, $2) RETURNING *',
      [name, display_order || 0]
    );
    res.status(201).json(newProf.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Meslek eklenirken hata oluştu.' });
  }
});

// Meslek Tanımını Güncelle (PUT)
app.put('/api/professions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order } = req.body;

    const updatedProf = await db.query(
      'UPDATE professions SET name = $1, display_order = $2 WHERE id = $3 RETURNING *',
      [name, display_order || 0, id]
    );

    if (updatedProf.rows.length === 0) {
      return res.status(404).json({ error: 'Meslek tanımı bulunamadı.' });
    }

    res.json(updatedProf.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Meslek tanımı güncellenirken hata oluştu.' });
  }
});

// Meslek Tanımını Sil (DELETE)
app.delete('/api/professions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProf = await db.query(
      'DELETE FROM professions WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedProf.rows.length === 0) {
      return res.status(404).json({ error: 'Meslek tanımı bulunamadı.' });
    }

    res.json({ message: 'Meslek tanımı başarıyla silindi.', profession: deletedProf.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Meslek tanımı silinirken hata oluştu. Bağlı personel kayıtları olabilir.' });
  }
});




// --- ÇALIŞANLAR API ROTALARI ---

// 1. Tüm Çalışanları Meslek Adıyla Listele (GET)
app.get('/api/employees', async (req, res) => {
  try {
    const queryText = `
      SELECT 
        e.*, 
        p.name AS profession_name 
      FROM employees e
      LEFT JOIN professions p ON e.profession_id = p.id
      ORDER BY e.id DESC
    `;
    const result = await db.query(queryText);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Çalışanlar alınırken hata oluştu.' });
  }
});

// 2. Yeni Çalışan Ekle (POST) - Meslek ID Destekli
app.post('/api/employees', async (req, res) => {
  try {
    const { first_name, last_name, profession_id, phone, commission_rate } = req.body;

    const newEmployee = await db.query(
      'INSERT INTO employees (first_name, last_name, profession_id, phone, commission_rate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [first_name, last_name, profession_id || null, phone, commission_rate || 0.00]
    );

    res.status(201).json(newEmployee.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Çalışan eklenirken sunucu hatası oluştu.' });
  }
});

// 3. Çalışan Durumunu Güncelle (PATCH)
app.patch('/api/employees/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const updatedEmployee = await db.query(
      'UPDATE employees SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    if (updatedEmployee.rows.length === 0) {
      return res.status(404).json({ error: 'Çalışan bulunamadı.' });
    }

    res.json(updatedEmployee.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Çalışan durumu güncellenirken hata oluştu.' });
  }
});

// Personel Bilgilerini Güncelle (PUT)
app.put('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, profession_id, phone, commission_rate, is_active } = req.body;

    const updatedEmployee = await db.query(
      `UPDATE employees 
       SET first_name = $1, 
           last_name = $2, 
           profession_id = $3, 
           phone = $4, 
           commission_rate = $5, 
           is_active = $6 
       WHERE id = $7 
       RETURNING *`,
      [first_name, last_name, profession_id || null, phone, commission_rate || 0, is_active ?? true, id]
    );

    if (updatedEmployee.rows.length === 0) {
      return res.status(404).json({ error: 'Personel kaydı bulunamadı.' });
    }

    res.json(updatedEmployee.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Personel bilgileri güncellenirken bir hata oluştu.' });
  }
});

// Personel Sil (DELETE)
app.delete('/api/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmployee = await db.query(
      'DELETE FROM employees WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedEmployee.rows.length === 0) {
      return res.status(404).json({ error: 'Personel kaydı bulunamadı.' });
    }

    res.json({ 
      message: 'Personel kaydı başarıyla silindi.', 
      employee: deletedEmployee.rows[0] 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ 
      error: 'Personel silinirken hata oluştu. Tamamlanmış randevularda veya işlemlerde kaydı bulunabilir.' 
    });
  }
});




// --- ODA TANIMLARI API ROTALARI ---

// 1. Tüm Odaları Listele (GET)
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms ORDER BY display_order ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Oda tanımları alınırken hata oluştu.' });
  }
});

// 2. Yeni Oda Ekle (POST)
app.post('/api/rooms', async (req, res) => {
  try {
    const { name, capacity, display_order } = req.body;
    const newRoom = await db.query(
      'INSERT INTO rooms (name, capacity, display_order) VALUES ($1, $2, $3) RETURNING *',
      [name, capacity || 1, display_order || 0]
    );
    res.status(201).json(newRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Oda eklenirken hata oluştu.' });
  }
});

// 3. Oda Durumunu Güncelle / Aktif-Pasif Yap (PATCH)
app.patch('/api/rooms/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const updatedRoom = await db.query(
      'UPDATE rooms SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    if (updatedRoom.rows.length === 0) {
      return res.status(404).json({ error: 'Oda bulunamadı.' });
    }

    res.json(updatedRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Oda durumu güncellenirken hata oluştu.' });
  }
});

// Oda Tanımını Güncelle (PUT)
app.put('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, display_order, is_active } = req.body;

    const updatedRoom = await db.query(
      `UPDATE rooms 
       SET name = $1, 
           capacity = $2, 
           display_order = $3, 
           is_active = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, capacity || 1, display_order || 0, is_active ?? true, id]
    );

    if (updatedRoom.rows.length === 0) {
      return res.status(404).json({ error: 'Oda tanımı bulunamadı.' });
    }

    res.json(updatedRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Oda güncellenirken hata oluştu.' });
  }
});

// Oda Tanımını Sil (DELETE)
app.delete('/api/rooms/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRoom = await db.query(
      'DELETE FROM rooms WHERE id = $1 RETURNING *',
      [id]
    );

    if (deletedRoom.rows.length === 0) {
      return res.status(404).json({ error: 'Oda tanımı bulunamadı.' });
    }

    res.json({ message: 'Oda tanımı başarıyla silindi.', room: deletedRoom.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Oda silinirken hata oluştu. Geçmiş randevularda kullanılıyor olabilir.' });
  }
});





// --- DÖVİZ TANIMLARI API ROTALARI ---

// 1. Tüm Döviz Tanımlarını Listele (GET)
app.get('/api/currencies', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM currencies ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Döviz tanımları alınırken hata oluştu.' });
  }
});

// 2. Yeni Döviz Birimi Ekle (POST)
app.post('/api/currencies', async (req, res) => {
  try {
    const { code, name, symbol, exchange_rate } = req.body;

    // Kod teklik kontrolü (EUR, USD vs.)
    const existing = await db.query('SELECT * FROM currencies WHERE code = $1', [code.toUpperCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu döviz kodu zaten tanımlı.' });
    }

    const newCurrency = await db.query(
      'INSERT INTO currencies (code, name, symbol, exchange_rate) VALUES ($1, $2, $3, $4) RETURNING *',
      [code.toUpperCase(), name, symbol, exchange_rate || 1.0000]
    );

    res.status(201).json(newCurrency.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Döviz eklenirken hata oluştu.' });
  }
});

// 3. Döviz Kuru Güncelle (PATCH)
app.patch('/api/currencies/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { exchange_rate } = req.body;

    const updatedCurrency = await db.query(
      'UPDATE currencies SET exchange_rate = $1 WHERE id = $2 RETURNING *',
      [exchange_rate, id]
    );

    if (updatedCurrency.rows.length === 0) {
      return res.status(404).json({ error: 'Döviz birimi bulunamadı.' });
    }

    res.json(updatedCurrency.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Döviz kuru güncellenirken hata oluştu.' });
  }
});



// --- APPOINTMENTS (RANDEVULAR) LISTELEME ---
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await db.query(`
      SELECT 
        a.id,
        a.start_time AS appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.total_price,
        a.notes,
        c.first_name AS customer_first_name,
        c.last_name AS customer_last_name,
        COALESCE(e.first_name, 'Atanmadı') AS employee_first_name,
        COALESCE(e.last_name, '') AS employee_last_name,
        s.name AS service_name,
        s.duration_minutes,
        s.currency
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN employees e ON a.employee_id = e.id
      ORDER BY a.start_time DESC
    `);
    res.json(appointments.rows);
  } catch (err) {
    console.error('Randevular Çekilirken Hata:', err.message);
    res.status(500).json({ error: err.message });
  }
});




// --- 3. YENİ RANDEVU EKLE ---// --- APPOINTMENTS YENİ EKLENME (POST) ---
app.post('/api/appointments', async (req, res) => {
  try {
    const { customer_id, service_id, employee_id, appointment_date, total_price, notes } = req.body;

    // Hizmet süresini veritabanından çekip bitiş saatini hesaplayalım
    const serviceRes = await db.query('SELECT duration_minutes FROM services WHERE id = $1', [service_id]);
    const duration = serviceRes.rows[0]?.duration_minutes || 60;

    const startTime = new Date(appointment_date);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const newApp = await db.query(
      `INSERT INTO appointments 
       (customer_id, service_id, employee_id, start_time, end_time, total_price, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Bekliyor') 
       RETURNING *`,
      [
        customer_id,
        service_id,
        employee_id || null,
        startTime,
        endTime,
        total_price,
        notes || ''
      ]
    );

    res.json(newApp.rows[0]);
  } catch (err) {
    console.error('Randevu Oluşturma Hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// --- APPOINTMENTS DURUM GÜNCELLEME (PATCH) ---
app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE appointments SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Durum güncellendi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});





// --- ODA MATRIX & GÜNLÜK DURUMU GETİR ---
app.get('/api/room-schedule', async (req, res) => {
  try {
    const { date } = req.query; // Örn: '2026-09-10'
    const selectedDate = date || new Date().toISOString().split('T')[0];

    // Odaları getir
    const rooms = await db.query('SELECT * FROM rooms ORDER BY id ASC');
    
    // O güne ait tüm oda kullanım kayıtlarını getir
    const appointments = await db.query(`
      SELECT 
        ra.*,
        r.name as room_name,
        r.capacity as room_capacity,
        s.name as service_name,
        s.price as service_price,
        COALESCE(c.first_name || ' ' || c.last_name, ra.new_customer_name, 'Misafir') as customer_fullname,
        COALESCE(e.first_name || ' ' || e.last_name, 'Atanmadı') as employee_fullname,
        COALESCE((SELECT SUM(total_price) FROM room_orders WHERE room_appointment_id = ra.id), 0) as total_orders_amount
      FROM room_appointments ra
      JOIN rooms r ON ra.room_id = r.id
      LEFT JOIN services s ON ra.service_id = s.id
      LEFT JOIN customers c ON ra.customer_id = c.id
      LEFT JOIN employees e ON ra.employee_id = e.id
      WHERE DATE(ra.start_time) = $1
      ORDER BY ra.start_time ASC
    `, [selectedDate]);

    res.json({
      rooms: rooms.rows,
      appointments: appointments.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ODAYA KAYIT/GİRİŞ YAPMA ---
app.post('/api/room-appointments', async (req, res) => {
  try {
    const { room_id, customer_id, new_customer_name, service_id, employee_id, start_time, duration_minutes, guest_count, notes } = req.body;

    // 1. Oda Kapasite Kontrolü
    const roomRes = await db.query('SELECT capacity FROM rooms WHERE id = $1', [room_id]);
    if (roomRes.rows.length === 0) return res.status(400).json({ error: 'Oda bulunamadı.' });
    
    if (guest_count > roomRes.rows[0].capacity) {
      return res.status(400).json({ error: `Oda kapasitesi aşamazsınız! Maksimum kapasite: ${roomRes.rows[0].capacity}` });
    }

    // 2. Kaydet
    const newRecord = await db.query(`
      INSERT INTO room_appointments 
      (room_id, customer_id, new_customer_name, service_id, employee_id, start_time, duration_minutes, guest_count, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [room_id, customer_id || null, new_customer_name || null, service_id, employee_id || null, start_time, duration_minutes, guest_count, notes]);

    res.json(newRecord.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ODAYA YEMEK / İÇECEK / ADİSYON EKLEME ---
app.post('/api/room-orders', async (req, res) => {
  try {
    const { room_appointment_id, product_id, quantity } = req.body;

    // Ürün fiyatını çek
    const productRes = await db.query('SELECT price FROM products WHERE id = $1', [product_id]);
    if (productRes.rows.length === 0) return res.status(400).json({ error: 'Ürün bulunamadı.' });
    
    const unit_price = productRes.rows[0].price;
    const total_price = unit_price * quantity;

    const newOrder = await db.query(`
      INSERT INTO room_orders (room_appointment_id, product_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [room_appointment_id, product_id, quantity, unit_price, total_price]);

    res.json(newOrder.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});







const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});