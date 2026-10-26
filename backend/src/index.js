require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  role: { type: String, enum: ['restaurant_admin', 'staff'], default: 'restaurant_admin' }
}, { timestamps: true });
const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  currency: { type: String, default: 'PKR' },
  taxRate: { type: Number, default: 0 }
}, { timestamps: true });
const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', maxlength: 500 },
  category: { type: String, required: true, trim: true, maxlength: 60, default: 'Other' },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true },
  recommendationTags: [{ type: String, trim: true, maxlength: 30 }]
}, { timestamps: true });
const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  orderNumber: { type: String, required: true },
  type: { type: String, enum: ['dine-in', 'takeaway', 'delivery'], default: 'takeaway' },
  customerName: { type: String, default: 'Walk-in customer' },
  items: [{ name: { type: String, required: true }, quantity: { type: Number, min: 1, required: true }, price: { type: Number, min: 0, required: true } }],
  subtotal: { type: Number, required: true }, tax: { type: Number, default: 0 }, total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'completed', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'mobile', 'unpaid'], default: 'unpaid' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  notes: { type: String, default: '' }
}, { timestamps: true });
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema);
const secret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) throw new Error('JWT_SECRET must be set to a random string of at least 24 characters in backend/.env');
  return process.env.JWT_SECRET;
};
const auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ message: 'Please sign in first.' });
    const payload = jwt.verify(token, secret());
    const user = await User.findById(payload.sub).select('name email role restaurantId');
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
    req.user = user;
    next();
  } catch (e) { res.status(401).json({ message: e.name === 'TokenExpiredError' ? 'Session expired. Please sign in again.' : e.message.includes('JWT_SECRET') ? e.message : 'Invalid session. Please sign in again.' }); }
};
app.get('/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date().toISOString() }));
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, restaurantName, restaurantAddress = '' } = req.body || {};
    if (!name?.trim() || !email?.trim() || !restaurantName?.trim() || !password || password.length < 8) return res.status(400).json({ message: 'Name, valid email, restaurant name, and password (at least 8 characters) are required.' });
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const restaurantId = new mongoose.Types.ObjectId();
    const restaurant = await Restaurant.create({ _id: restaurantId, name: restaurantName.trim(), address: restaurantAddress.trim(), ownerId: restaurantId });
    try {
      const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12), restaurantId: restaurant._id });
      restaurant.ownerId = user._id; await restaurant.save();
      const token = jwt.sign({ sub: user._id.toString() }, secret(), { expiresIn: process.env.JWT_EXPIRATION || '1d' });
      res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, restaurant: { id: restaurant._id, name: restaurant.name } });
    } catch (e) { await Restaurant.deleteOne({ _id: restaurant._id }); throw e; }
  } catch (e) { res.status(e.code === 11000 ? 409 : 500).json({ message: e.code === 11000 ? 'Email already registered.' : e.message || 'Registration failed.' }); }
});
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase(); const password = String(req.body?.password || '');
    const user = await User.findOne({ email }).select('+passwordHash name email role restaurantId');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const restaurant = await Restaurant.findById(user.restaurantId);
    const token = jwt.sign({ sub: user._id.toString() }, secret(), { expiresIn: process.env.JWT_EXPIRATION || '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role }, restaurant: restaurant ? { id: restaurant._id, name: restaurant.name, address: restaurant.address, currency: restaurant.currency, taxRate: restaurant.taxRate } : null });
  } catch (e) { res.status(500).json({ message: e.message || 'Login failed.' }); }
});
app.get('/api/me', auth, async (req, res) => {
  const restaurant = await Restaurant.findById(req.user.restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
  res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }, restaurant });
});
// Menu management: every query is scoped to the authenticated restaurant.
app.get('/api/menu', auth, async (req, res) => {
  const items = await MenuItem.find({ restaurantId: req.user.restaurantId }).sort({ category: 1, name: 1 }).lean();
  res.json({ data: items, count: items.length });
});
app.post('/api/menu', auth, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const category = String(req.body?.category || 'Other').trim();
    const price = Number(req.body?.price);
    if (!name || name.length > 100 || !category || category.length > 60 || !Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Enter an item name, category, and a valid non-negative price.' });
    const item = await MenuItem.create({ restaurantId: req.user.restaurantId, name, category, price: Math.round(price * 100) / 100, description: String(req.body?.description || '').trim().slice(0, 500), available: req.body?.available !== false, recommendationTags: Array.isArray(req.body?.recommendationTags) ? req.body.recommendationTags.map(x => String(x).trim().slice(0, 30)).filter(Boolean).slice(0, 10) : [] });
    res.status(201).json({ data: item, message: 'Menu item saved.' });
  } catch (e) { res.status(500).json({ message: 'Could not save menu item.' }); }
});
app.patch('/api/menu/:id', auth, async (req, res) => {
  const update = {};
  if (req.body?.name !== undefined) update.name = String(req.body.name).trim().slice(0, 100);
  if (req.body?.description !== undefined) update.description = String(req.body.description).trim().slice(0, 500);
  if (req.body?.category !== undefined) update.category = String(req.body.category).trim().slice(0, 60);
  if (req.body?.price !== undefined) { const price = Number(req.body.price); if (!Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Price must be a non-negative number.' }); update.price = Math.round(price * 100) / 100; }
  if (req.body?.available !== undefined) update.available = Boolean(req.body.available);
  const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, restaurantId: req.user.restaurantId }, update, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ message: 'Menu item not found.' });
  res.json({ data: item, message: 'Menu item updated.' });
});
app.delete('/api/menu/:id', auth, async (req, res) => {
  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
  if (!item) return res.status(404).json({ message: 'Menu item not found.' });
  res.json({ message: 'Menu item deleted.' });
});
app.get('/api/menu/recommendations', auth, async (req, res) => {
  const items = await MenuItem.find({ restaurantId: req.user.restaurantId, available: true }).sort({ createdAt: -1 }).limit(100).lean();
  const tags = new Set(String(req.query.tags || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean));
  const scored = items.map(item => ({ ...item, score: (item.recommendationTags || []).filter(tag => tags.has(String(tag).toLowerCase())).length + (/drink|fries|side|dessert|combo/i.test(item.category + ' ' + item.name) ? 1 : 0) })).sort((a,b) => b.score - a.score || a.name.localeCompare(b.name));
  res.json({ data: scored.slice(0, 6) });
});

app.get('/api/orders', auth, async (req, res) => {
  const orders = await Order.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ data: orders, count: orders.length });
});
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, type = 'takeaway', customerName = 'Walk-in customer', paymentMethod = 'unpaid', notes = '' } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Add at least one item.' });
    if (!['dine-in', 'takeaway', 'delivery'].includes(type)) return res.status(400).json({ message: 'Invalid order type.' });
    const normalized = [];
    for (const i of items) {
      const quantity = Number(i.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return res.status(400).json({ message: 'Each item needs a whole-number quantity between 1 and 999.' });
      if (i.menuItemId) {
        const menuItem = await MenuItem.findOne({ _id: i.menuItemId, restaurantId: req.user.restaurantId, available: true }).lean();
        if (!menuItem) return res.status(400).json({ message: 'A selected menu item is unavailable or no longer exists. Refresh the menu and try again.' });
        normalized.push({ name: menuItem.name, quantity, price: menuItem.price });
      } else {
        const name = String(i.name || '').trim().slice(0, 100); const price = Number(i.price);
        if (!name || !Number.isFinite(price) || price < 0) return res.status(400).json({ message: 'Each custom item needs a name and non-negative price.' });
        normalized.push({ name, quantity, price: Math.round(price * 100) / 100 });
      }
    }
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    const subtotal = Math.round(normalized.reduce((sum, i) => sum + i.quantity * i.price, 0) * 100) / 100;
    const tax = Math.round(subtotal * (Math.max(0, Math.min(30, restaurant?.taxRate || 0)) / 100) * 100) / 100;
    const count = await Order.countDocuments({ restaurantId: req.user.restaurantId });
    const order = await Order.create({ restaurantId: req.user.restaurantId, orderNumber: `R-${Date.now().toString().slice(-8)}-${String(count + 1).padStart(3, '0')}`, type, customerName: String(customerName).trim().slice(0, 100) || 'Walk-in customer', items: normalized, subtotal, tax, total: subtotal + tax, paymentMethod: ['cash','card','mobile','unpaid'].includes(paymentMethod) ? paymentMethod : 'unpaid', paymentStatus: paymentMethod === 'unpaid' ? 'unpaid' : 'paid', notes: String(notes).slice(0, 500) });
    res.status(201).json({ data: order, message: 'Order saved.' });
  } catch (e) { res.status(500).json({ message: e.message || 'Could not create order.' }); }
});
app.patch('/api/orders/:id/status', auth, async (req, res) => {
  // Keep this workflow in sync with the order screen. Terminal states cannot be reopened.
  const nextStatuses = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };
  const requestedStatus = req.body?.status;
  if (!Object.prototype.hasOwnProperty.call(nextStatuses, requestedStatus)) {
    return res.status(400).json({ message: 'Choose a valid order status.' });
  }

  try {
    const order = await Order.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (order.status === requestedStatus) return res.json({ data: order, message: 'Order already has that status.' });
    if (!nextStatuses[order.status]?.includes(requestedStatus)) {
      const allowed = nextStatuses[order.status] || [];
      return res.status(409).json({
        message: allowed.length
          ? `This order is ${order.status}. The next allowed status is: ${allowed.join(' or ')}.`
          : `Orders marked ${order.status} cannot be changed.`,
        currentStatus: order.status,
        allowedNextStatuses: allowed
      });
    }
    order.status = requestedStatus;
    await order.save();
    res.json({ data: order, message: `Order moved to ${requestedStatus}.` });
  } catch (e) {
    if (e.name === 'CastError') return res.status(400).json({ message: 'Invalid order ID.' });
    res.status(500).json({ message: 'Could not update order status.' });
  }
});
app.patch('/api/orders/:id/payment', auth, async (req, res) => {
  const method = req.body?.paymentMethod;
  if (!['cash','card','mobile','unpaid'].includes(method)) return res.status(400).json({ message: 'Choose cash, card, mobile, or unpaid.' });
  const order = await Order.findOneAndUpdate({ _id: req.params.id, restaurantId: req.user.restaurantId }, { paymentMethod: method, paymentStatus: method === 'unpaid' ? 'unpaid' : 'paid' }, { new: true, runValidators: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ data: order });
});
app.use((req, res, next) => { if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path === '/health') return next(); res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html')); });
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Unexpected server error.' }); });
const PORT = Number(process.env.PORT || 5000);
async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing. Copy backend/.env.example to backend/.env and configure it.');
  secret();
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  app.listen(PORT, '0.0.0.0', () => console.log(`Restaurant Management is ready at http://localhost:${PORT}`));
}
start().catch(err => { console.error(`Startup failed: ${err.message}`); process.exit(1); });
