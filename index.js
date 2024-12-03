const express = require('express');
const cron = require('node-cron');

const app = express();
app.use(express.json());

// In-memory storage
const menu = new Map(); // Menu items: { id: { id, name, price, category } }
const orders = new Map(); // Orders: { id: { id, items, status, createdAt } }

// Predefined categories
const validCategories = ['Appetizer', 'Main Course', 'Dessert'];

// API: Add Menu Item
app.post('/menu', (req, res) => {
  const { id, name, price, category } = req.body;

  // Validation
  if (!id || !name || typeof price !== 'number' || price <= 0 || !validCategories.includes(category)) {
    return res.status(400).send('Invalid input');
  }

  // Add or update menu item
  menu.set(id, { id, name, price, category });
  res.status(201).send('Menu item added/updated successfully');
});

// API: Get Menu
app.get('/menu', (req, res) => {
  res.json([...menu.values()]);
});

// API: Place Order
app.post('/orders', (req, res) => {
  const { items } = req.body;

  // Validation
  if (!Array.isArray(items) || items.some(itemId => !menu.has(itemId))) {
    return res.status(400).send('Invalid items');
  }

  // Create order
  const id = `${Date.now()}`;
  orders.set(id, { id, items, status: 'Preparing', createdAt: new Date() });

  res.status(201).send({ orderId: id });
});

// API: Get Order
app.get('/orders/:id', (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).send('Order not found');
  res.json(order);
});

// CRON Job: Update Order Status
cron.schedule('* * * * *', () => {
  console.log('Running CRON job to update order statuses...');
  orders.forEach(order => {
    if (order.status === 'Preparing') {
      order.status = 'Out for Delivery';
    } else if (order.status === 'Out for Delivery') {
      order.status = 'Delivered';
    }
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

