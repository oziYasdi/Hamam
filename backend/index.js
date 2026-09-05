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

const PORT = process.env.PORT || 5000;

// --- MÜŞTERİ API ROTALARI ---

// 1. Tüm Müşterileri Listele (GET)
app.get('/api/customers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Müşteriler alınırken hata oluştu.' });
  }
});

// 2. Yeni Müşteri Ekle (POST)
app.post('/api/customers', async (req, res) => {
  try {
    const { first_name, last_name, phone, gender, notes } = req.body;

    // Telefon numarası kontrolü
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



app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});