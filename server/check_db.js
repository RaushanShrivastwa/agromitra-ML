const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const Order = require('./models/Order');
const Product = require('./models/Product');
const User = require('./models/User');

async function run() {
  console.log("Connecting to:", process.env.MONGO_URI);
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected!");
  
  const users = await User.find({});
  console.log("Users count:", users.length);
  users.forEach(u => {
    console.log(`User ID: ${u._id}, Username: ${u.username}, Email: ${u.email}, Role: ${u.role}`);
  });
  
  const products = await Product.find({});
  console.log("Products count:", products.length);
  for (const p of products) {
    console.log(`Product ID: ${p._id}, Name: ${p.name}, Rating: ${p.rating}`);
  }
  
  const orders = await Order.find({});
  console.log("Orders count:", orders.length);
  orders.forEach(o => {
    console.log(`Order ID: ${o._id}, User: ${o.userId}, Status: ${o.status}, Items:`, JSON.stringify(o.items, null, 2));
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
