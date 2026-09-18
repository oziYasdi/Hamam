const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const db = require('./db');
const { syncTcmbRates, getLatestRates, ensureExchangeRatesTable } = require('./tcmb');

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
// 1. Ürün Gruplarını Listele (GET)
// ?active=true → yalnızca is_active = true olanlar (POS / rezervasyon)
app.get('/api/product-groups', async (req, res) => {
  try {
    const onlyActive = req.query.active === 'true';
    const result = await db.query(
      onlyActive
        ? 'SELECT * FROM product_groups WHERE is_active = true ORDER BY display_order ASC, name ASC'
        : 'SELECT * FROM product_groups ORDER BY display_order ASC, name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grupları çekilirken hata oluştu.' });
  }
});


// 2. Yeni Ürün Grubu Ekle (POST)
// 2. Yeni Ürün Grubu Ekle (POST)
app.post('/api/product-groups', async (req, res) => {
  try {
    const { name, display_order, is_appointment_service } = req.body;

    const newGroup = await db.query(
      'INSERT INTO product_groups (name, display_order, is_appointment_service) VALUES ($1, $2, $3) RETURNING *',
      [name, display_order || 0, is_appointment_service ?? false]
    );

    res.status(201).json(newGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Ürün grubu eklenirken hata oluştu.' });
  }
});

// 3. Ürün Grubunu Güncelle (PUT)
// 3. Ürün Grubunu Güncelle (PUT)
app.put('/api/product-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_order, is_active, is_appointment_service } = req.body;

    const updatedGroup = await db.query(
      'UPDATE product_groups SET name = $1, display_order = $2, is_active = $3, is_appointment_service = $4 WHERE id = $5 RETURNING *',
      [name, display_order || 0, is_active ?? true, is_appointment_service ?? false, id]
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
// GET /api/products
// ?active=true  → yalnızca aktif ürünler (ve aktif grup)
// ?group_id=N   → seçilen grubun ürünleri (POS sol sütun)
app.get('/api/products', async (req, res) => {
  try {
    const { group_id, active } = req.query;
    const conditions = [];
    const params = [];

    if (group_id) {
      params.push(parseInt(group_id, 10));
      conditions.push(`p.group_id = $${params.length}`);
    }

    if (active === 'true') {
      conditions.push('p.is_active = true');
      conditions.push('g.is_active = true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const productsRes = await db.query(
      `
      SELECT
        p.id,
        p.group_id,
        p.name,
        p.price,
        p.currency,
        p.duration_minutes,
        p.is_active,
        p.created_at,
        g.name AS group_name,
        g.is_appointment_service
      FROM products p
      LEFT JOIN product_groups g ON p.group_id = g.id
      ${where}
      ORDER BY p.name ASC
      `,
      params
    );

    res.json(productsRes.rows);
  } catch (err) {
    console.error('SQL Hatası:', err.message);
    res.status(500).json({ error: err.message });
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
    await ensureExchangeRatesTable(db);
    const result = await db.query(`
      SELECT
        c.*,
        COALESCE(latest.try_rate, c.exchange_rate) AS live_rate,
        latest.rate_date
      FROM currencies c
      LEFT JOIN LATERAL (
        SELECT try_rate, rate_date
        FROM exchange_rates er
        WHERE UPPER(er.currency_code) = UPPER(c.code)
        ORDER BY rate_date DESC
        LIMIT 1
      ) latest ON true
      ORDER BY c.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Döviz tanımları alınırken hata oluştu.' });
  }
});

app.get('/api/exchange-rates', async (req, res) => {
  try {
    const data = await getLatestRates(db);
    res.json(data);
  } catch (err) {
    console.error('Kur okuma hatası:', err.message);
    res.status(500).json({ error: 'Döviz kurları alınamadı.' });
  }
});

app.post('/api/exchange-rates/sync', async (req, res) => {
  try {
    const result = await syncTcmbRates(db);
    const latest = await getLatestRates(db);
    res.json({ message: 'TCMB kurları güncellendi.', ...result, latest });
  } catch (err) {
    console.error('TCMB senkron hatası:', err.message);
    res.status(502).json({ error: 'TCMB kurları çekilemedi: ' + err.message });
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

// Randevu/Oda açılış modalları için sadece randevuda listelenebilir ürünleri getirir
app.get('/api/appointment-services', async (req, res) => {
  try {
    const query = `
      SELECT p.*, g.name as group_name 
      FROM products p
      INNER JOIN product_groups g ON p.group_id = g.id
      WHERE g.is_appointment_service = true
        AND g.is_active = true
        AND p.is_active = true
      ORDER BY p.name ASC
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) {
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
        COALESCE(s.currency, 'TRY') as service_currency,
        COALESCE(c.first_name || ' ' || c.last_name, ra.new_customer_name, 'Misafir') as customer_fullname,
        COALESCE(e.first_name || ' ' || e.last_name, 'Atanmadı') as employee_fullname,
        COALESCE((SELECT SUM(total_price) FROM room_orders WHERE room_appointment_id = ra.id), 0) as total_orders_amount
      FROM room_appointments ra
      JOIN rooms r ON ra.room_id = r.id
      LEFT JOIN products s ON ra.service_id = s.id
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

const roomAppointmentListSql = `
  SELECT
    ra.*,
    r.name as room_name,
    r.capacity as room_capacity,
    s.name as service_name,
    s.price as service_price,
    COALESCE(s.currency, 'TRY') as service_currency,
    COALESCE(s.duration_minutes, ra.duration_minutes) as service_duration_minutes,
    COALESCE(c.first_name || ' ' || c.last_name, ra.new_customer_name, 'Misafir') as customer_fullname,
    c.first_name as customer_first_name,
    c.last_name as customer_last_name,
    c.phone as customer_phone,
    COALESCE(e.first_name || ' ' || e.last_name, 'Atanmadı') as employee_fullname,
    COALESCE((SELECT SUM(total_price) FROM room_orders WHERE room_appointment_id = ra.id), 0) as total_orders_amount
  FROM room_appointments ra
  JOIN rooms r ON ra.room_id = r.id
  LEFT JOIN products s ON ra.service_id = s.id
  LEFT JOIN customers c ON ra.customer_id = c.id
  LEFT JOIN employees e ON ra.employee_id = e.id
`;

app.get('/api/room-appointments', async (req, res) => {
  try {
    const result = await db.query(`${roomAppointmentListSql} ORDER BY ra.start_time DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Oda randevuları çekilirken hata:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- ODAYA KAYIT/GİRİŞ YAPMA ---
app.post('/api/room-appointments', async (req, res) => {
  try {
    const { room_id, customer_id, new_customer_name, service_id, employee_id, start_time, duration_minutes, guest_count, notes } = req.body;

    const roomRes = await db.query('SELECT capacity FROM rooms WHERE id = $1', [room_id]);
    if (roomRes.rows.length === 0) return res.status(400).json({ error: 'Oda bulunamadı.' });

    if (guest_count > roomRes.rows[0].capacity) {
      return res.status(400).json({ error: `Oda kapasitesi aşamazsınız! Maksimum kapasite: ${roomRes.rows[0].capacity}` });
    }

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

app.patch('/api/room-appointments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await db.query(
      'UPDATE room_appointments SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/room-appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      room_id,
      customer_id,
      new_customer_name,
      service_id,
      employee_id,
      start_time,
      duration_minutes,
      guest_count,
      notes,
      status,
    } = req.body;

    const existing = await db.query('SELECT * FROM room_appointments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Randevu bulunamadı.' });
    }

    const current = existing.rows[0];
    const nextRoomId = room_id ?? current.room_id;
    const nextGuestCount = guest_count ?? current.guest_count;

    if (nextRoomId) {
      const roomRes = await db.query('SELECT capacity FROM rooms WHERE id = $1', [nextRoomId]);
      if (roomRes.rows.length === 0) {
        return res.status(400).json({ error: 'Oda bulunamadı.' });
      }
      if (nextGuestCount > roomRes.rows[0].capacity) {
        return res.status(400).json({
          error: `Oda kapasitesi aşamazsınız! Maksimum kapasite: ${roomRes.rows[0].capacity}`,
        });
      }
    }

    const updated = await db.query(
      `UPDATE room_appointments SET
        room_id = $1,
        customer_id = $2,
        new_customer_name = $3,
        service_id = $4,
        employee_id = $5,
        start_time = $6,
        duration_minutes = $7,
        guest_count = $8,
        notes = $9,
        status = $10
      WHERE id = $11
      RETURNING *`,
      [
        nextRoomId,
        customer_id === undefined ? current.customer_id : customer_id || null,
        new_customer_name === undefined ? current.new_customer_name : new_customer_name || null,
        service_id === undefined ? current.service_id : service_id,
        employee_id === undefined ? current.employee_id : employee_id || null,
        start_time === undefined ? current.start_time : start_time,
        duration_minutes === undefined ? current.duration_minutes : duration_minutes,
        nextGuestCount,
        notes === undefined ? current.notes : notes,
        status === undefined ? current.status : status,
        id,
      ]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error('Oda randevusu güncelleme hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- ODAYA KAYIT/GİRİŞ YAPMA ---
// Oda Adisyon/Randevu Detayını Getiren Endpoint
app.get('/api/room-appointments/active/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const query = `
      SELECT 
        ra.*,
        p.name AS service_name,
        p.price AS service_price,
        p.currency AS service_currency,
        e.name AS employee_name,
        c.name AS customer_name
      FROM room_appointments ra
      LEFT JOIN products p ON ra.service_id = p.id
      LEFT JOIN employees e ON ra.employee_id = e.id
      LEFT JOIN customers c ON ra.customer_id = c.id
      WHERE ra.room_id = $1 AND ra.status = 'active'
      LIMIT 1
    `;
    const result = await db.query(query, [roomId]);
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error("Adisyon verisi çekilemedi:", err);
    res.status(500).json({ error: err.message });
  }
});






// --- ADİSYONA YENİ ÜRÜN / SİPARİŞ EKLE ---
app.post('/api/room-orders', async (req, res) => {
  try {
    const { room_appointment_id, product_id, quantity } = req.body;

    // Ürün fiyatını çek
    const productRes = await db.query('SELECT price FROM products WHERE id = $1', [product_id]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Ürün bulunamadı.' });
    }

    const unit_price = parseFloat(productRes.rows[0].price) || 0;
    const qty = parseInt(quantity, 10) || 1;
    const total_price = unit_price * qty;

    // Siparişi kaydet
    const newOrder = await db.query(`
      INSERT INTO room_orders (room_appointment_id, product_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [room_appointment_id, product_id, qty, unit_price, total_price]);

    res.status(201).json(newOrder.rows[0]);
  } catch (err) {
    console.error('Sipariş ekleme hatası:', err.message);
    res.status(500).json({ error: err.message });
  }
});

  // --- BELİRLİ BİR REZERVASYONA AİT ADİSYON SİPARİŞLERİNİ GETİR ---
app.get('/api/room-orders/:appointment_id', async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const orders = await db.query(`
      SELECT 
        ro.id,
        ro.product_id,
        ro.quantity,
        ro.unit_price,
        ro.total_price,
        p.name AS product_name,
        COALESCE(p.currency, 'TRY') AS currency
      FROM room_orders ro
      JOIN products p ON ro.product_id = p.id
      WHERE ro.room_appointment_id = $1
      ORDER BY ro.id ASC
    `, [appointment_id]);

    res.json(orders.rows);
  } catch (err) {
    console.error('Adisyon çekme hatası:', err.message);
    res.status(500).json({ error: 'Adisyon siparişleri alınamadı.' });
  }
});

app.post('/api/room-orders/bulk-save', async (req, res) => {
  const { room_appointment_id, orders } = req.body;

  if (!room_appointment_id) {
    return res.status(400).json({ error: 'room_appointment_id parametresi eksik.' });
  }

  try {
    // 1. Transaction Başlat
    await db.query('BEGIN');

    // 2. Bu randevuya ait eski adisyonları sil
    await db.query(
      'DELETE FROM room_orders WHERE room_appointment_id = $1',
      [room_appointment_id]
    );

    // 3. Yeni siparişleri ekle
    if (Array.isArray(orders) && orders.length > 0) {
      for (const order of orders) {
        const productId = order.product_id || order.id;
        const quantity = parseInt(order.quantity, 10) || 1;
        const unitPrice = parseFloat(order.unit_price || order.price) || 0;
        const totalPrice = parseFloat(order.total_price) || (unitPrice * quantity);

        if (!productId) continue;

        await db.query(
          `INSERT INTO room_orders (room_appointment_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [room_appointment_id, productId, quantity, unitPrice, totalPrice]
        );
      }
    }

    // 4. Değişiklikleri Kaydet
    await db.query('COMMIT');
    res.status(200).json({ message: 'Adisyon başarıyla kaydedildi.' });

  } catch (err) {
    // Hata durumunda işlemleri geri al
    await db.query('ROLLBACK');
    console.error('Bulk Save Hatası:', err);
    res.status(500).json({ error: 'Adisyon kaydedilemedi: ' + err.message });
  }
});



// Backend DELETE Endpoint Örneği
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Silinecek randevuyu veritabanından çekin
    const app = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    if (app.rows.length === 0) return res.status(404).json({ error: 'Rezervasyon bulunamadı.' });

    // BACKEND TARİH KONTROLÜ DÜZELTMESİ:
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appDate = new Date(app.rows[0].appointment_date);
    appDate.setHours(0, 0, 0, 0);

    if (appDate < today) {
      return res.status(400).json({ error: 'Geçmiş günlere ait rezervasyonlar silinemez!' });
    }

    // Silme işlemini gerçekleştirin
    await db.query('DELETE FROM appointments WHERE id = $1', [id]);
    res.json({ message: 'Rezervasyon silindi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// --- REZERVASYON SİLME / İPTAL ENDPOINT'İ ---
// Oda Rezervasyonu Silme Endpoint'i (/api/room-appointments/:id)
app.delete('/api/room-appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Silinecek oda randevusunu room_appointments tablosundan çekin
    const app = await db.query('SELECT * FROM room_appointments WHERE id = $1', [id]);
    
    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Oda rezervasyonu bulunamadı.' });
    }

    // 2. Geçmiş gün kontrolü (Tarih formatı: appointment_date veya date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rawDate = app.rows[0].appointment_date || app.rows[0].date;
    const appDate = new Date(rawDate);
    appDate.setHours(0, 0, 0, 0);

    if (appDate < today) {
      return res.status(400).json({ error: 'Geçmiş günlere ait oda rezervasyonları silinemez!' });
    }

    // 3. İsteğe bağlı: Varsa bu oda randevusuna ait adisyon/siparişleri temizle
    await db.query('DELETE FROM room_orders WHERE room_appointment_id = $1', [id]);

    // 4. Oda randevusunu sil
    await db.query('DELETE FROM room_appointments WHERE id = $1', [id]);

    res.json({ message: 'Oda rezervasyonu başarıyla silindi.' });
  } catch (err) {
    console.error("Delete room appointment error:", err);
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
  syncTcmbRates(db)
    .then((result) => {
      console.log(`TCMB kurları yüklendi (${result.rateDate}, ${result.count} döviz).`);
    })
    .catch((err) => {
      console.error('Başlangıç TCMB kur senkronu başarısız:', err.message);
    });
});

cron.schedule(
  '15 15 * * *',
  () => {
    syncTcmbRates(db)
      .then((result) => {
        console.log(`Günlük TCMB kurları güncellendi (${result.rateDate}).`);
      })
      .catch((err) => {
        console.error('Günlük TCMB kur senkronu başarısız:', err.message);
      });
  },
  { timezone: 'Europe/Istanbul' }
);