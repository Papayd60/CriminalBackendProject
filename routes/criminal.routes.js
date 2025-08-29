import express from 'express'; // ✅ Express হলো Node.js-এর সবচেয়ে জনপ্রিয় Framework, যা দিয়ে API/Server তৈরি করা যায়

import multer from 'multer'; // ✅ Multer হলো একটি middleware, যেটা ফাইল (ছবি, পিডিএফ) upload করার জন্য ব্যবহৃত হয়
import fs from 'fs';
import { v2 as cloudinaryV2 } from 'cloudinary';
import dotenv from 'dotenv';
import * as controller from '../controllers/criminal.controller.js';
import verifyToken from '../allToken.js'; // ✅ যদি default export করা থাকে
import pool from '../services/db.js';

console.log({
  registerPolice: controller.registerPolice,
  getSecureloginPolice: controller.loginPolice,
  getVulnerable: controller.getVulnerable,
});

dotenv.config();

const router = express.Router();

// ✅ Multer Config (Single & Multiple)
// ✅ লোকাল ফোল্ডার তৈরি (criminaluploads নামে ফোল্ডার যদি না থাকে তবে বানাবে)
const localDir = './criminaluploads'; // 👉 লোকাল ফোল্ডার পাথ
if (!fs.existsSync(localDir)) fs.mkdirSync(localDir); // 👉 ফোল্ডার না থাকলে নতুন ফোল্ডার বানাবে

// ✅ Multer সেটআপ (মেমরিতে ফাইল রাখবে)
const storage = multer.memoryStorage(); // 👉 ফাইলগুলো RAM/Buffer-এ রাখা হবে
export const upload = multer({ storage }); // 👉 Multer instance export করা হলো

// ✅ Cloudinary Config
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  api_environment_variable: process.env.CLOUDINARY_API_Environment_Variable
});

// ✅ Routes
// ✅ এই রুটটি ডেটাবেস থেকে সব ক্রিমিনালের তথ্য নিয়ে আসে
router.get('/', async (req, res) => {
  try {
    // ✅ pool কে সরাসরি ইম্পোর্ট না করে middleware থেকে req.pool ব্যবহার করা হয়েছে।
    const [rows] = await pool.query('SELECT * FROM criminal_info');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching criminals:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.post('/register', controller.registerPolice);             // ✅ Prepared Statement - Register Operations
router.post('/login', controller.loginPolice);      // ✅ Prepared Statement - Login Operations
router.post('/vulnerable', controller.getVulnerable);            // 🛑 No token (SQL injection possible)
//🔐 verifyToken যদি সফল (valid token) হয় — তাহলে তখনই পরবর্তী স্টেপগুলো (যেমন upload.array(...) এবং controller.criminalRecordInsert) পরিচালিত হবে।

// 1️⃣ Client ➜ Request পাঠায় (header-এ token সহ এবং body-তে file সহ)
//       ↓
// 2️⃣ verifyToken ➜ token valid কিনা চেক করে
//       ↓ (যদি valid হয়)
// 3️⃣ upload.array ➜ ফাইলগুলো handle করে
//       ↓
// 4️⃣ controller.criminalRecordInsert ➜ ডেটা সেভ, ফাইল আপলোড ইত্যাদি করে

//🔹 Headers:
// Key: Authorization
// Value: Bearer <your_token_here>

router.post('/criminalRecordInsert', verifyToken, upload.array('myFiles', 20), controller.criminalRecordInsert); // ✅ With token + Prepared Statement - Insert Operations
router.post('/criminalRecordUpdate', verifyToken, upload.array('myFiles', 20), controller.criminalRecordUpdate); // ✅ With token + Prepared Statement - Update Operations
router.post('/criminalRecordStatusChange', verifyToken, controller.criminalRecordStatusChange); // ✅ With token + Prepared Statement - Delete Operations
router.post('/criminalRecordindividualview', verifyToken, controller.criminalRecordindividualview); // ✅ With token + Prepared Statement - Delete Operations
router.post('/criminalRecordallview', verifyToken, controller.criminalRecordallview); // ✅ With token + Prepared Statement - Delete Operations
router.post("/download-reportASpdf", verifyToken, controller.downloadCriminalReportasPDF);// 🔹 Upload PDF to Cloudinary 🔹 PDF Download API
router.post("/download-reportASExcel", verifyToken, controller.downloadCriminalReportasEXCEL);// 🔹 EXCEL Download API
export default router;
