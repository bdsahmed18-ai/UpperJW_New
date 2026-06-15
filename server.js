require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' })); // large enough for base64 images
app.use(express.static(path.join(__dirname, 'public')));

// ── MongoDB Connection ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Schemas ──
const deliverySchema = new mongoose.Schema({
  date:  String,
  qty:   Number,
  note:  String,
}, { _id: false });

const productSchema = new mongoose.Schema({
  _pid:     String,
  article:  String,
  color:    String,
  qty:      String,
  sizes:    String,
  notes:    String,
  priority: String,
  image:    String, // base64
  deliveries: [deliverySchema],
}, { _id: false });

const orderSchema = new mongoose.Schema({
  vendor:         String,
  date:           String,
  products:       [productSchema],
  manualComplete: { type: Boolean, default: false },
  createdAt:      { type: Number, default: () => Date.now() },
  updatedAt:      { type: Number, default: () => Date.now() },
});

const Order = mongoose.model('Order', orderSchema);

// ── API Routes ──

// GET all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ updatedAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST create order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order({ ...req.body, createdAt: Date.now(), updatedAt: Date.now() });
    await order.save();
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT update order
app.put('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 BLUEDOL running on port ${PORT}`));
