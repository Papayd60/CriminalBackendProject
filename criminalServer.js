// 📁 server.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors'; // Angular Defult PORT 4200 , Nodejs Server Port Defult 3000/8000 , browser did no't understand 
import ejs from 'ejs'; // HTML view template
import puppeteer from 'puppeteer'; // HTML থেকে PDF convert করার জন্য
import criminalRoutes from './routes/criminal.routes.js';
// CORS কেন ব্যবহার করা হয়?

// সহজ কথায়, CORS হলো একটি নিরাপত্তা ব্যবস্থা যা ব্রাউজারকে বোঝায় যে অন্য একটি ডোমেইন থেকে আসা অনুরোধ গ্রহণ করা নিরাপদ।
// যদি আপনার Angular অ্যাপ্লিকেশন localhost:4200-এ চলে এবং Node.js সার্ভার localhost:3000-এ চলে, তাহলে ব্রাউজারের কাছে এই দুটি আলাদা ডোমেইন হিসেবে বিবেচিত হয়।
// ব্রাউজারের একটি নিয়ম আছে: "এক ডোমেইনের কোড অন্য ডোমেইনের সার্ভারকে সরাসরি ডেটা চাইতে পারবে না, যদি না সার্ভার অনুমতি দেয়।"
// CORS এর কাজ হলো: Node.js সার্ভারে cors প্যাকেজ ব্যবহার করলে, আপনি সার্ভারকে বলে দেন যে "হ্যাঁ, localhost:4200 থেকে আসা অনুরোধগুলো আমার জন্য ঠিক আছে। 
// তুমি সেগুলোকে গ্রহণ করতে পারো।"
// এই অনুমতির কারণে ব্রাউজার আর নিরাপত্তা সংক্রান্ত বাধা দেয় না, এবং Angular অ্যাপ্লিকেশনটি Node.js সার্ভার থেকে ডেটা আনতে পারে।

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ ডেটাবেস সংযোগ ফাংশন
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST, // ✅ রেলওয়ের এনভায়রনমেন্ট ভেরিয়েবলের নাম ব্যবহার করা হয়েছে
      user: process.env.MYSQL_USER, // ✅ রেলওয়ের এনভায়রনমেন্ট ভেরিয়েবলের নাম ব্যবহার করা হয়েছে
      password: process.env.MYSQL_PASSWORD, // ✅ রেলওয়ের এনভায়রনমেন্ট ভেরিয়েবলের নাম ব্যবহার করা হয়েছে
      database: process.env.MYSQL_DATABASE, // ✅ রেলওয়ের এনভায়রনমেন্ট ভেরিয়েবলের নাম ব্যবহার করা হয়েছে
      port: process.env.MYSQL_PORT, // ✅ রেলওয়ের এনভায়রনমেন্ট ভেরিয়েবলের নাম ব্যবহার করা হয়েছে
    });
    console.log('✅ Connected to MySQL Database!');
    return connection;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
}

// ✅ সার্ভার চালু করার আগে ডেটাবেস সংযোগ স্থাপন
async function startServer() {
  await connectToDatabase();
  
  // ✅ Connect Routes
  app.use('/api/criminals', criminalRoutes);

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

// ✅ সার্ভার শুরু করা
startServer();
