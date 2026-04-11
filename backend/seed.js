/**
 * StockEase - Demo Data Seeder
 * Run: node seed.js
 * This populates the database with realistic demo data for demonstration.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Supplier = require('./models/Supplier');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // ── Users ──────────────────────────────────────────────────────
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@stockease.com',
      password: 'admin123',
      role: 'admin',
    });

    const empUser = await User.create({
      name: 'Jane Employee',
      email: 'employee@stockease.com',
      password: 'emp123',
      role: 'employee',
    });

    console.log('Users created');

    // ── Suppliers ──────────────────────────────────────────────────
    const [s1, s2, s3] = await Supplier.insertMany([
      {
        name: 'TechWorld Supplies',
        email: 'info@techworld.com',
        phone: '+1 555 100 2000',
        address: '123 Tech Street, San Francisco, CA',
        notes: 'Primary electronics supplier. Net-30 payment terms.',
      },
      {
        name: 'Global Goods Inc.',
        email: 'orders@globalgoods.com',
        phone: '+1 555 200 3000',
        address: '456 Commerce Ave, New York, NY',
        notes: 'Apparel and accessories. Minimum order: 50 units.',
      },
      {
        name: 'QuickShip Ltd.',
        email: 'supply@quickship.com',
        phone: '+1 555 300 4000',
        address: '789 Logistics Blvd, Chicago, IL',
        notes: '2-day guaranteed delivery. Office supplies specialist.',
      },
    ]);

    console.log('Suppliers created');

    // ── Products ───────────────────────────────────────────────────
    const [p1, p2, p3, p4, p5, p6, p7, p8] = await Product.insertMany([
      {
        name: 'Wireless Bluetooth Headphones',
        category: 'Electronics',
        price: 89.99,
        quantity: 45,
        lowStockThreshold: 10,
        supplier: s1._id,
        description: 'Over-ear noise-cancelling headphones, 30hr battery life.',
      },
      {
        name: 'USB-C Charging Hub (7-Port)',
        category: 'Electronics',
        price: 49.99,
        quantity: 8,
        lowStockThreshold: 10,
        supplier: s1._id,
        description: '7-port USB-C hub with HDMI and SD card reader.',
      },
      {
        name: 'Mechanical Keyboard',
        category: 'Electronics',
        price: 129.99,
        quantity: 22,
        lowStockThreshold: 5,
        supplier: s1._id,
        description: 'TKL layout, Cherry MX Blue switches, RGB backlight.',
      },
      {
        name: 'Running Sneakers (Men)',
        category: 'Footwear',
        price: 74.99,
        quantity: 60,
        lowStockThreshold: 15,
        supplier: s2._id,
        description: 'Lightweight breathable mesh upper, cushioned sole.',
      },
      {
        name: 'Slim Fit Polo Shirt',
        category: 'Apparel',
        price: 29.99,
        quantity: 7,
        lowStockThreshold: 10,
        supplier: s2._id,
        description: 'Cotton-blend polo, available in 5 colours.',
      },
      {
        name: 'Leather Wallet (Bifold)',
        category: 'Accessories',
        price: 34.99,
        quantity: 33,
        lowStockThreshold: 8,
        supplier: s2._id,
        description: 'Genuine leather, 8 card slots, RFID-blocking.',
      },
      {
        name: 'Office Chair (Ergonomic)',
        category: 'Furniture',
        price: 249.99,
        quantity: 4,
        lowStockThreshold: 5,
        supplier: s3._id,
        description: 'Lumbar support, adjustable armrests, mesh back.',
      },
      {
        name: 'A4 Printer Paper (500 sheets)',
        category: 'Office Supplies',
        price: 9.99,
        quantity: 120,
        lowStockThreshold: 20,
        supplier: s3._id,
        description: '80gsm premium white paper, acid-free.',
      },
    ]);

    console.log('Products created');

    // ── Orders ─────────────────────────────────────────────────────
    // Order 1 — Completed
    const order1 = new Order({
      items: [
        { product: p1._id, productName: p1.name, quantity: 2, price: p1.price },
        { product: p3._id, productName: p3.name, quantity: 1, price: p3.price },
      ],
      totalAmount: p1.price * 2 + p3.price * 1,
      status: 'Completed',
      createdBy: adminUser._id,
      notes: 'Express delivery requested.',
    });
    await order1.save();

    // Order 2 — Pending
    const order2 = new Order({
      items: [
        { product: p4._id, productName: p4.name, quantity: 3, price: p4.price },
        { product: p6._id, productName: p6.name, quantity: 2, price: p6.price },
      ],
      totalAmount: p4.price * 3 + p6.price * 2,
      status: 'Pending',
      createdBy: empUser._id,
    });
    await order2.save();

    // Order 3 — Cancelled
    const order3 = new Order({
      items: [
        { product: p7._id, productName: p7.name, quantity: 1, price: p7.price },
      ],
      totalAmount: p7.price * 1,
      status: 'Cancelled',
      createdBy: empUser._id,
      notes: 'Customer changed their mind.',
    });
    await order3.save();

    // Order 4 — Completed
    const order4 = new Order({
      items: [
        { product: p8._id, productName: p8.name, quantity: 5, price: p8.price },
        { product: p2._id, productName: p2.name, quantity: 2, price: p2.price },
      ],
      totalAmount: p8.price * 5 + p2.price * 2,
      status: 'Completed',
      createdBy: adminUser._id,
    });
    await order4.save();

    // Order 5 — Pending
    const order5 = new Order({
      items: [
        { product: p5._id, productName: p5.name, quantity: 4, price: p5.price },
      ],
      totalAmount: p5.price * 4,
      status: 'Pending',
      createdBy: empUser._id,
    });
    await order5.save();

    console.log('Orders created');

    console.log('\n✅ Seed complete! Demo credentials:');
    console.log('   Admin  → admin@stockease.com   / admin123');
    console.log('   Employee → employee@stockease.com / emp123\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seed();
