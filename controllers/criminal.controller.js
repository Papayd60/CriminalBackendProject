
// | ধাপ                  | কি করা হচ্ছে                   |
// | -------------------- | ------------------------------ |
// | `beginTransaction()` | ট্রান্সঅ্যাকশন শুরু            |
// | `execute(...)`       | ডেটা ইনসার্ট                   |
// | `commit()`           | সবকিছু ঠিক থাকলে ডেটা স্থায়ী   |
// | `rollback()`         | কোনো একটিতে ভুল হলে সব বাতিল   |
// | `release()`          | কানেকশন রিলিজ (অবশ্যই প্রয়োজন) |

// Node.js (Express + MySQL) অ্যাপে Transaction ব্যবহার করা হয় এমন সব কাজের জন্য যেখানে 
// একাধিক SQL অপারেশন একসাথে সফল না হলে সব বাদ দিতে হবে — যাতে ডেটা ভুলভাবে সেভ না হয়।

// | কাজের ধরন            | Transaction দরকার? |
// | -------------------- | ------------------ |
// | Login / Select Only  | ❌ না               |
// | Insert into 1 Table  | ❌ না               |
// | Insert into Multiple | ✅ হ্যাঁ            |
// | Update Multiple Rows | ✅ হ্যাঁ            |
// | Delete Multiple Rows | ✅ হ্যাঁ            |


// ✅ ডেটাবেস কানেকশনের জন্য pool ইমপোর্ট করছি
import pool from '../services/db.js';
// ✅ পাসওয়ার্ড সিকিউর করার জন্য bcrypt ব্যবহার করছি
import bcrypt from 'bcrypt';
import Joi from "joi";// ✅ Joi → ইনপুট ডেটা validate করার জন্য (সব ইনপুট mandatory কিনা চেক করতে)
import fs from "fs";// 📦 Local file system access করার জন্য
import ejs from 'ejs'; // EJS template engine
import path from 'path'; // Path utilities
import streamifier from "streamifier";
import puppeteer from 'puppeteer'; // HTML → PDF generator
import { fileURLToPath } from 'url';
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
// ✅ JSON Web Token ইমপোর্ট (লগিনের জন্য)
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';                         // ▶️ Excel তৈরি/Export করার জন্য ExcelJS লাইব্রেরি ব্যবহার করা হচ্ছে
import { log } from 'console';

dotenv.config();

// 1. Register
// POST - http://localhost:3000/api/criminals/register
// {
//     "officer_name" : "Soma Roy",
//     "branch_name" : "CID",
//     "district" : "Bankura",
//     "password" : "TestBank@1234"
// }
// export const registerPolice = async (req, res) => {
//   const { officer_name, branch_name, district, password } = req.body;

//   if (!officer_name || !branch_name || !district || !password) {
//     return res.status(400).json({ message: '❌ সব ফিল্ড পূরণ করতে হবে।' });
//   }

//   const passwordRegex =
//     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^])[A-Za-z\d@$!%*?#&^]{8,}$/;

//   if (!passwordRegex.test(password)) {
//     return res.status(400).json({
//       message:
//         '❌ পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে এবং Capital, small, digit ও special symbol থাকতে হবে।',
//     });
//   }

//   const connection = await pool.getConnection(); // ✅ ডেটাবেস কানেকশন নিচ্ছি

//   try {
//     await connection.beginTransaction(); // ✅ ট্রান্সঅ্যাকশন শুরু

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
//     const districtCode = district.replace(/\s+/g, '').toUpperCase().substring(0, 4);
//     const prefix = branch_name.toUpperCase() === 'CID' ? 'WBCID' : 'WBINC';

//     const [countResult] = await connection.query('SELECT COUNT(*) AS count FROM police_station');
//     // SELECT COUNT(*) AS count ডাটাবেজে police_station টেবিলের কতগুলো রো (ডাটা রেকর্ড) আছে, সেটা গুনে বের করে।ধরো টেবিলে এখন 5টা রেকর্ড আছে → তাহলে count হবে 5।
//     const newIdNo = countResult[0].count + 1;
//     // count + 1 → টেবিলে যত রেকর্ড আছে, তার সাথে ১ যোগ করে নতুন রেকর্ডের নম্বর ঠিক করা।টেবিল খালি থাকলে → নতুন নম্বর হবে 1।
//     // কিন্তু একসাথে দুইজন ডাটা দিলে নম্বর ডুপ্লিকেট হতে পারে, তাই টেবিল বানানোর সময় AUTO_INCREMENT ব্যবহার করাই ভালো।
//     const police_id = `${prefix}${today}${districtCode}${newIdNo}`;

//     // ✅ পুলিশ রেজিস্ট্রেশন
//     await connection.execute(
//       `INSERT INTO police_station 
//         (police_id, officer_name, branch_name, district, password_hash) 
//         VALUES (?, ?, ?, ?, ?)`,
//       [police_id, officer_name, branch_name, district, hashedPassword]
//     );

//     // ✅ এক্সট্রা উদাহরণ: একটি লগ টেবিলে ইনসার্ট করলাম ALTER TABLE registration_logs RENAME TO Invstregistration_logs;
//     await connection.execute(
//       `INSERT INTO invstregistrationlogin_logs (police_id, registered_at) VALUES (?, NOW())`,
//       [police_id]
//     );

//     await connection.commit(); // ✅ সব ঠিক থাকলে কমিট করুন

//     res.status(201).json({ message: '✅ অফিসার সফলভাবে রেজিস্টার হয়েছেন', police_id });
//     console.log('✅ অফিসার সফলভাবে রেজিস্টার হয়েছেন', police_id);

//   } catch (err) {
//     await connection.rollback(); // ❌ কোনো সমস্যা হলে rollback করুন
//     console.error('❌ রেজিস্ট্রেশন ত্রুটি:', err);
//     res.status(500).json({ error: '❌ সার্ভার এরর: রেজিস্ট্রেশন ব্যর্থ' });
//   } finally {
//     connection.release(); // ✅ কানেকশন রিলিজ করুন
//   }
// };
export const registerPolice = async (req, res) => {
  const { officer_name, branch_name, district, password } = req.body;
  console.log("Requested Body -", req.body);
  if (!officer_name || !branch_name || !district || !password) {
    return res.status(400).json({ message: '❌ সব ফিল্ড পূরণ করতে হবে।' });
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&^])[A-Za-z\d@$!%*?#&^]{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        '❌ পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে এবং Capital, small, digit ও special symbol থাকতে হবে।',
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Encrypted Password Is -", hashedPassword);
    // Stored Procedure কল
    const [resultSets] = await pool.query("CALL register_police(?, ?, ?, ?)", [
      officer_name,
      branch_name,
      district,
      hashedPassword
    ]);

    console.log("SELECT এর সমস্ত rows (array of objects) - ", resultSets[0]);
    console.log("SELECT এর প্রথম row (single object) -", resultSets[0][0]);

    const rows = resultSets[0];  // rows হচ্ছে array of objects

    if (rows && rows.length > 0) {
      res.status(201).json({
        "Police Id": rows[0].police_id,
        "Officer Name": rows[0].officer_name,
        "District": rows[0].district,
        "message": "✅ অফিসার সফলভাবে রেজিস্টার হয়েছেন"
      });
    } else {
      res.status(400).json({ message: "❌ অফিসার রেজিস্টার হয়নি" });
    }

  } catch (err) {
    console.error('❌ রেজিস্ট্রেশন ত্রুটি:', err);
    res.status(500).json({ error: '❌ সার্ভার এরর: রেজিস্ট্রেশন ব্যর্থ' });
  }
};

// 2. Login Secure (Prepared + Token) 🔐 নিরাপদ লগইন ফাংশন
// POST -  http://localhost:3000/api/criminals/login
// {
//     "police_id" : "WBCID09082025BANK1",
//     "password" : "TestBank@1234"
// }
export const loginPolice = async (req, res) => {
  const { police_id, password } = req.body; // ইনপুট নেওয়া
  console.log("Requested Body -", req.body);
  if (!police_id || !password) {
    return res.status(400).json({ message: '❌ Police ID এবং password আবশ্যক' });
  }

  const connection = await pool.getConnection();
  try {
    // SP কল
    const [rows] = await connection.query(
      "CALL sp_login_police(?)",
      [police_id]
    );

    const user = rows[0][0]; // প্রথম রেকর্ড
    console.log("প্রথম রেকর্ড -", user);
    if (!user || !user.police_id) {
      return res.status(404).json({ message: '❌ Officer not found' });
    }

    // bcrypt দিয়ে পাসওয়ার্ড মিলানো
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("User Password -", password);
    console.log("Database Password -", `${user.password_hash}`);
    console.log("Password Match Status -", isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: '❌ Incorrect password' });
    }

    // লগ টেবিলে ইনসার্ট → Trigger চালু হবে
    await connection.query(
      `INSERT INTO invstregistrationlogin_logs (police_id, registered_at) VALUES (?, NOW())`,
      [police_id]
    );

    // JWT তৈরি
    const token = jwt.sign(
      {
        police_id: user.police_id,
        officer_name: user.officer_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    delete user.password_hash; // পাসওয়ার্ড রেসপন্সে পাঠানো হবে না

    res.status(200).json({
      message: '✅ Login successful',
      user,
      token
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ message: '❌ সার্ভার ত্রুটি' });
  } finally {
    connection.release();
  }
};

// 3. Vulnerable (No Token) ' OR 1=1 -- SQL ইনজেকশন পরীক্ষার জন্য
// POST - http://localhost:3000/api/criminals/vulnerable
// {
//     "police_id" : "' OR 1=1 -- ", এখানে -- এর পরের অংশ MySQL ignore করবে, এবং OR 1=1 সব রেকর্ড ফিরিয়ে দেবে।
//     "password" : "any"
// }
export const getVulnerable = async (req, res) => {
  // 👉 ক্লায়েন্টের থেকে police_id ও password নিচ্ছে
  const { police_id, password } = req.body;
  if (!police_id || !password) {
    return res.status(400).json({ message: '❌ সব ফিল্ড পূরণ করতে হবে।' });
  }
  try {
    // ❗❗❗ বিপজ্জনকভাবে ডিরেক্ট স্ট্রিং কনক্যাট করে SQL query বানানো হয়েছে
    // 👉 এখানে SQL Injection সম্ভব , ✳️ এখানে ${police_id} এবং ${password} সরাসরি মিশে যাচ্ছে SQL এর ভিতরে
    const query = `SELECT * FROM police_station WHERE police_id = '${police_id}' AND password = '${password}'`;
    const [rows] = await pool.query(query);

    // 👉 ফেচ করা ডেটা ক্লায়েন্টকে পাঠানো হচ্ছে
    res.json(rows);
    console.log('✅ All Data Fetch successful', rows);
  } catch (err) {
    // 👉 কোনো সমস্যা হলে এরর পাঠানো হচ্ছে
    console.error("SQL Error:", err); // 👉 এই লাইন যোগ করো
    res.status(500).json({ error: '❌ Failed to fetch (Vulnerable)' });
  }

};

// export const criminalRecordInsert = async (req, res) => { // 👉 ✅ Criminal রেকর্ড ইনসার্ট করার জন্য একটি অ্যাসিনক্রোনাস ফাংশন এক্সপোর্ট করা হয়েছে
//   const conn = await pool.getConnection(); // 👉 ✅ ডেটাবেস কানেকশন নেওয়া হয়েছে (Prepared Statement-এর জন্য)
//   try {
//     await conn.beginTransaction(); // 👉 ✅ ট্রান্সঅ্যাকশন শুরু করা হলো যাতে দুইটা টেবিলে ডেটা একসাথে ইনসার্ট করা যায়

//     const { name, aadhaar, phone, type, address, date, time, police_id } = req.body; // 👉 ✅ ইউজারের দেওয়া রিকোয়েস্ট বডি থেকে প্রয়োজনীয় ইনফর্মেশনগুলো নিচ্ছি
//     console.log('BODY:', JSON.parse(JSON.stringify(req.body)));
//     console.log('FILES:', req.files);
//     console.log(Object.keys(req.body));
//     if (!police_id || !address || !name || !aadhaar || !phone || !type || !date || !time) { // 👉 ✅ যদি কোনো ফিল্ড না থাকে, তাহলে এরর রেসপন্স পাঠানো হবে
//       return res.status(400).json({ msg: '❌ Required fields missing!' }); // 👉 ✅ ইউজারকে জানিয়ে দেওয়া হচ্ছে যে কোনো ইনফর্মেশন মিসিং
//     }

//     let photo_url = ''; // 👉 ✅ Cloudinary URL-এর জন্য ফাঁকা ভ্যারিয়েবল
//     let local_file_path = ''; // 👉 ✅ লোকাল ফাইল path রাখার জন্য ফাঁকা ভ্যারিয়েবল

//     if (req.files && req.files.length > 0) { // 👉 ✅ যদি ফাইল আসে তাহলে এই অংশ চলবে
//       const photoBuffer = req.files[0].buffer; // 👉 ✅ আপলোড হওয়া ছবির buffer নেওয়া হলো
//       const originalName = req.files[0].originalname; // 👉 ✅ ছবির মূল নাম রাখা হলো
//       const fileName = Date.now() + '_' + originalName; // 👉 ✅ নতুন নাম তৈরি হলো যাতে ইউনিক থাকে
//       const filePath = path.join('criminaluploads', fileName); // 👉 ✅ লোকাল সিস্টেমে ফাইলের পাথ সেট করা হলো

//       // ✅ লোকাল ফাইল সেভ করা হচ্ছে
//       fs.writeFileSync(filePath, photoBuffer); // 👉 ✅ Buffer থেকে ফাইল লিখে লোকাল ফোল্ডারে সেভ করা হচ্ছে
//       local_file_path = filePath; // 👉 ✅ সেই path আমরা ভ্যারিয়েবলে রাখছি
//       console.log("Photo LOCAL PATH ----", local_file_path); // 👉 ✅ ডিবাগ করার জন্য লোকাল পাথ কনসোলে দেখানো

//       // ✅ Cloudinary তে আপলোড করা হচ্ছে
//       const uploadResult = await new Promise((resolve, reject) => { // 👉 ✅ নতুন প্রমিস তৈরি করে cloudinary তে async ভাবে আপলোড করা
//         const stream = cloudinaryV2.uploader.upload_stream( // 👉 ✅ Cloudinary স্ট্রিম মেথড ব্যবহার করে আপলোড শুরু
//           { folder: 'criminal_photos', resource_type: 'image' },// 👉 ✅ ফোল্ডার ও রিসোর্স টাইপ ডিফাইন করা হয়েছে
//           (error, result) => {// 👉 ✅ যদি ভুল হয় বা ঠিক মতো আপলোড হয়
//             if (error) reject(error);// 👉 ✅ ভুল হলে reject
//             else resolve(result);// 👉 ✅ সাকসেস হলে resolve
//           }
//         );
//         stream.end(photoBuffer); // 👉 ✅ ছবির buffer শেষ করে স্ট্রিমে পাঠানো হচ্ছে
//       });
//       photo_url = uploadResult.secure_url;// 👉 ✅ Cloudinary থেকে প্রাপ্ত ফাইনাল URL রাখা হলো
//       console.log("Photo URL ----", photo_url); // 👉 ✅ Cloudinary লিংক কনসোলে দেখানো
//     }

//     // ✅ criminal_info টেবিলে ইনসার্ট
//     const [infoResult] = await conn.execute(
//       `INSERT INTO criminal_info (police_id, name, aadhaar, address, phone, photo_url, created_at, local_file_path)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [police_id, name, aadhaar, address, phone, photo_url, new Date(), local_file_path]
//     );// 👉 ✅ ডেটা ডাটাবেসে ইনসার্ট করা হচ্ছে criminal_info 
//     // 👉 undefined আসলে সেটা null-এ রূপান্তর করে ,"error": "Bind parameters must not contain undefined. To pass SQL NULL specify JS null"
//     //   const safe = (val) => val === undefined ? null : val;

//     //   // ✅ criminal_info টেবিলে ইনসার্ট করছি
//     //   const [infoResult] = await conn.execute(
//     //     `INSERT INTO criminal_info (police_id, name, aadhaar, address, phone, photo_url, local_file_path ,created_at)
//     //  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     //     [
//     //       safe(police_id),
//     //       safe(name),
//     //       safe(aadhaar),
//     //       safe(address),
//     //       safe(phone),
//     //       safe(photo_url),
//     //       safe(local_file_path),
//     //       new Date()
//     //     ]
//     //   );
//     console.log("Criminal Info Insert Payload:", [police_id, name, aadhaar, address, phone, photo_url, local_file_path, new Date()]);
//     console.log("INSERT Query Executed");
//     console.log("infoResult:", infoResult);
//     const criminal_id = infoResult.insertId;// 👉 ✅ criminal_info ইনসার্টের পর নতুন criminal_id পাওয়া গেলো
//     console.log("Criminal ID ----", criminal_id);
//     // ✅ criminal_description টেবিলে ইনসার্ট
//     await conn.execute(
//       `INSERT INTO criminal_description (criminal_id, police_id, type, fir_place, date, time, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [criminal_id, police_id, type, address, date, time, new Date()]
//     );// 👉 ✅ criminal_description টেবিলেও ইনসার্ট করা হচ্ছে criminal_id সহ
//     console.log("Criminal Desc Insert Payload:", [criminal_id, police_id, type, address, date, time, new Date()]);
//     await conn.commit();// 👉 ✅ সফলভাবে ইনসার্ট হলে ট্রান্সঅ্যাকশন কমিট করা হচ্ছে
//     res.json({ msg: '✅ Criminal Record Inserted', cloud_url: photo_url, saved_path: local_file_path });// 👉 ✅ সফল রেসপন্স পাঠানো হচ্ছে client-কে

//   } catch (err) {// 👉 ✅ কোনো error হলে এই অংশ চলবে
//     await conn.rollback();// 👉 ✅ ট্রান্সঅ্যাকশন rollback করা হচ্ছে যেন কিছুই না সেভ হয়
//     res.status(500).json({ msg: '❌ Server error', error: err.message });// 👉 ✅ ইউজারকে error জানানো হচ্ছে
//   } finally {
//     conn.release();// 👉 ✅ কানেকশন বন্ধ করে দেওয়া হচ্ছে
//   }
// };

// 2. Criminal Record Insert Secure (Prepared + Token) 🔐 নিরাপদ লগইন ফাংশন
// POST -  http://localhost:3000/api/criminals/criminalRecordInsert

export const criminalRecordInsert = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      investigOfficer_id,
      crname,
      craadhaar,
      crphone,
      crtype,
      craddress,
      creventdate,
      creventtime,
      crfir_place
    } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!investigOfficer_id || !crname || !craadhaar || !craddress || !crphone ||
      !crtype || !creventdate || !creventtime || !crfir_place) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }

    let photo_url = ''; // 📌 myFiles ইনপুট ফিল্ডের জন্য প্রাথমিকভাবে ফাঁকা URL
    let local_file_path = '';
    const photoUrls = [];
    // 📂 Single File Upload (Local + Cloudinary)
    // if (req.files && req.files.length > 0) {
    //   const photoBuffer = req.files[0].buffer;
    //   const originalName = req.files[0].originalname;
    //   const fileName = `${Date.now()}_${originalName}`;
    //   const filePath = path.join('criminaluploads', fileName);

    //   fs.writeFileSync(filePath, photoBuffer);
    //   local_file_path = filePath;

    //   const uploadResult = await new Promise((resolve, reject) => {
    //     const stream = cloudinaryV2.uploader.upload_stream(
    //       { folder: 'criminal_photos', resource_type: 'image' },
    //       (error, result) => {
    //         if (error) reject(error);
    //         else resolve(result);
    //       }
    //     );
    //     stream.end(photoBuffer);
    //   });
    //   photo_url = uploadResult.secure_url;
    // }

    // 📂 Multiple File's Upload (Local + Cloudinary)
    // --------------------------------------------
    if (req.files && req.files.length > 0) {
      // 🗂️ সব ফাইলের লোকাল পাথ রাখার জন্য অ্যারে
      const localFilePaths = [];
      // 🌐 সব ফাইলের Cloudinary URL রাখার জন্য অ্যারে

      for (const file of req.files) {
        // ✅ লোকাল ফাইলে সেভ করা
        const photoBuffer = file.buffer; // ফাইল ডেটা (Buffer আকারে)
        const originalName = file.originalname; // আসল ফাইলের নাম
        const fileName = `${Date.now()}_${originalName}`; // ইউনিক নাম
        const filePath = path.join('criminaluploads', fileName); // লোকাল পাথ
        fs.writeFileSync(filePath, photoBuffer); // ফাইল লোকালে সেভ
        localFilePaths.push(filePath); // লোকাল পাথ অ্যারেতে যোগ করা

        // ✅ Cloudinary-তে ফাইল আপলোড (upload_stream ব্যবহার করে) , streaming buffer দিয়ে আপলোড করে, যা বড় ফাইল বা মেমোরিতে থাকা ডেটা হ্যান্ডল করার জন্য ভালো
        const uploadResult = await new Promise((resolve, reject) => {

          // 📤 Cloudinary-তে আপলোডের জন্য stream তৈরি করা হচ্ছে
          const stream = cloudinaryV2.uploader.upload_stream(
            {
              folder: 'criminal_photos',    // 📂 Cloudinary-তে কোন ফোল্ডারে সেভ হবে
              resource_type: 'image'        // 🖼 রিসোর্স টাইপ: image / video / raw
            },
            (error, result) => {            // ✅ আপলোড শেষ হলে কলব্যাক ফাংশন
              if (error) {                   // ❌ যদি আপলোডে ত্রুটি হয়
                console.error('Uploaded File ERROR:', error.message); // 🔴 error log
                reject(error);               // Promise reject
              } else {
                console.log('Uploaded File SUCCESS URL:', result.secure_url); // ✅ সফল হলে URL log
                resolve(result);              // Promise resolve
              }
            }
          );

          // 📦 আমাদের ফাইলের buffer data Cloudinary stream-এ পাঠানো হচ্ছে
          stream.end(photoBuffer);
        });
        console.log("uploadResult ----> ", uploadResult);

        // ক্লাউডিনারিতে ছবি সঠিকভাবে আপলোড হচ্ছে এবং uploadResult.secure_url থেকে সঠিক URL আসছে, https://res.cloudinary.com/dvdzohjye/image/upload/v1754938653/criminal_photos/jmvndt7wwqmkiwcdrw8x.jpg
        // কিন্তু ডাটাবেজে URL টি সেভ হওয়ার সময় অতিরিক্ত একটা / যোগ হয়ে যাচ্ছে শেষে, ফলে URL হয়: https://res.cloudinary.com/dvdzohjye/image/upload/v1754938653/criminal_photos/jmvndt7wwqmkiwcdrw8x.jpg/

        // 🌐 uploadResult.secure_url → Cloudinary-তে আপলোড হওয়া ফাইলের public URL
        console.log('Uploaded file URL:', uploadResult.secure_url.replace(/\/+$/, ''));// শেষের সব `/` কেটে ফেলা


        photoUrls.push(uploadResult.secure_url); // Cloudinary URL অ্যারেতে যোগ করা
        // try {
        // fs.unlinkSync() → শুধু ফাইল ডিলিট প্রসেস শেষ না হওয়া পর্যন্ত Node.js অন্য কাজ এক্সিকিউট করবে না (blocking / synchronous)
        // ফাইল যত বড় হোক না কেন, সেটা RAM বা local memory পুরোপুরি দখল করে রাখে না
        // (শুধু লোকাল ফাইল ডিলিট করে, রিমোট সার্ভার ফাইল নয় , synchronous হলে “লোকাল ফাইল ডিলিট না হওয়া পর্যন্ত পরের লাইন চলবে না)।
        // fs.unlink() (asynchronous) → ফাইল ডিলিট করার কাজ ব্যাকগ্রাউন্ডে হবে, আর event loop ফ্রি থাকবে অন্য কোড চালানোর জন্য।
        //     fs.unlinkSync(filePath);
        //     console.log("✅ ফাইল সফলভাবে ডিলিট হয়েছে:", filePath);
        // } catch (err) {
        //     console.error("❌ ফাইল ডিলিট করতে সমস্যা:", err.message);
        // }
        // photoUrls = []; // কল করাবার পুর পরে আরানো ডেটা মুছে যাচ্ছে বা ফাঁকা হয়ে যাচ্ছে।
        // local_file_path = ''; // কল করার পরে আবার পুরানো ডেটা মুছে যাচ্ছে বা ফাঁকা হয়ে যাচ্ছে।
        // photo_url = ''; // কল করার পরে আবার পুরানো ডেটা মুছে যাচ্ছে বা ফাঁকা হয়ে যাচ্ছে।
      }

      // 🔹 ডাটাবেসে array সরাসরি সেভ না করে → JSON string আকারে পাঠানো
      local_file_path = JSON.stringify(localFilePaths);
      photo_url = JSON.stringify(photoUrls);
      console.log('Uploaded URL:', photo_url);
    }

    // ✅ SP কল (১২ প্যারামিটার) — সঠিক অর্ডার মেনে
    const [result] = await conn.query(
      `CALL sp_criminal_info(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        investigOfficer_id, // 1
        crname,             // 2
        craadhaar,          // 3
        craddress,          // 4
        crphone,            // 5
        crtype,             // 6
        crfir_place,        // 7
        creventdate,        // 8
        creventtime,        // 9
        photo_url,          // 10
        new Date(),         // 11
        local_file_path     // 12
      ]
    );

    console.log("SP Result:", JSON.stringify(result, null, 2));

    if (!result || !result[0] || result[0].length === 0) {
      await conn.rollback();
      return res.status(400).json({ msg: '❌ SP থেকে কোনো ডেটা পাওয়া যায়নি!' });
    }

    await conn.commit();

    const spData = result[0][0]; // প্রথম রো

    res.json({
      msg: '✅ Criminal Record Inserted',
      sp_response: spData
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ msg: '❌ Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// 3. Criminal Record Update Secure (Prepared + Token) 🔐 নিরাপদ লগইন ফাংশন
// POST -  http://localhost:3000/api/criminals/criminalRecordUpdate

export const criminalRecordUpdate = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      investigOfficer_id,
      crid,
      crname,
      craadhaar,
      crphone,
      crtype,
      craddress,
      creventdate,
      creventtime,
      crfir_place
    } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!investigOfficer_id || !crid || !crname || !craadhaar || !craddress || !crphone ||
      !crtype || !creventdate || !creventtime || !crfir_place) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }

    let photo_url = ''; // 📌 myFiles ইনপুট ফিল্ডের জন্য প্রাথমিকভাবে ফাঁকা URL
    let local_file_path = '';
    const photoUrls = [];
    // 📂 Multiple File's Upload (Local + Cloudinary)
    // --------------------------------------------
    if (req.files && req.files.length > 0) {
      // 🗂️ সব ফাইলের লোকাল পাথ রাখার জন্য অ্যারে
      const localFilePaths = [];
      // 🌐 সব ফাইলের Cloudinary URL রাখার জন্য অ্যারে

      for (const file of req.files) {
        // ✅ লোকাল ফাইলে সেভ করা
        const photoBuffer = file.buffer; // ফাইল ডেটা (Buffer আকারে)
        const originalName = file.originalname; // আসল ফাইলের নাম
        const fileName = `${Date.now()}_${originalName}`; // ইউনিক নাম
        const filePath = path.join('criminaluploads', fileName); // লোকাল পাথ
        fs.writeFileSync(filePath, photoBuffer); // ফাইল লোকালে সেভ
        localFilePaths.push(filePath); // লোকাল পাথ অ্যারেতে যোগ করা

        // ✅ Cloudinary-তে ফাইল আপলোড (upload_stream ব্যবহার করে) , streaming buffer দিয়ে আপলোড করে, যা বড় ফাইল বা মেমোরিতে থাকা ডেটা হ্যান্ডল করার জন্য ভালো
        const uploadResult = await new Promise((resolve, reject) => {

          // 📤 Cloudinary-তে আপলোডের জন্য stream তৈরি করা হচ্ছে
          const stream = cloudinaryV2.uploader.upload_stream(
            {
              folder: 'criminal_photos',    // 📂 Cloudinary-তে কোন ফোল্ডারে সেভ হবে
              resource_type: 'image'        // 🖼 রিসোর্স টাইপ: image / video / raw
            },
            (error, result) => {            // ✅ আপলোড শেষ হলে কলব্যাক ফাংশন
              if (error) {                   // ❌ যদি আপলোডে ত্রুটি হয়
                console.error('Uploaded File ERROR:', error.message); // 🔴 error log
                reject(error);               // Promise reject
              } else {
                console.log('Uploaded File SUCCESS URL:', result.secure_url); // ✅ সফল হলে URL log
                resolve(result);              // Promise resolve
              }
            }
          );

          // 📦 আমাদের ফাইলের buffer data Cloudinary stream-এ পাঠানো হচ্ছে
          stream.end(photoBuffer);
        });
        console.log("uploadResult ----> ", uploadResult);

        // ক্লাউডিনারিতে ছবি সঠিকভাবে আপলোড হচ্ছে এবং uploadResult.secure_url থেকে সঠিক URL আসছে, https://res.cloudinary.com/dvdzohjye/image/upload/v1754938653/criminal_photos/jmvndt7wwqmkiwcdrw8x.jpg
        // কিন্তু ডাটাবেজে URL টি সেভ হওয়ার সময় অতিরিক্ত একটা / যোগ হয়ে যাচ্ছে শেষে, ফলে URL হয়: https://res.cloudinary.com/dvdzohjye/image/upload/v1754938653/criminal_photos/jmvndt7wwqmkiwcdrw8x.jpg/

        // 🌐 uploadResult.secure_url → Cloudinary-তে আপলোড হওয়া ফাইলের public URL
        console.log('Uploaded file URL:', uploadResult.secure_url.replace(/\/+$/, ''));// শেষের সব `/` কেটে ফেলা


        photoUrls.push(uploadResult.secure_url); // Cloudinary URL অ্যারেতে যোগ করা
        try {
        // fs.unlinkSync() → শুধু ফাইল ডিলিট প্রসেস শেষ না হওয়া পর্যন্ত Node.js অন্য কাজ এক্সিকিউট করবে না (blocking / synchronous)
        // ফাইল যত বড় হোক না কেন, সেটা RAM বা local memory পুরোপুরি দখল করে রাখে না
        // (শুধু লোকাল ফাইল ডিলিট করে, রিমোট সার্ভার ফাইল নয় , synchronous হলে “লোকাল ফাইল ডিলিট না হওয়া পর্যন্ত পরের লাইন চলবে না)।
        // fs.unlink() (asynchronous) → ফাইল ডিলিট করার কাজ ব্যাকগ্রাউন্ডে হবে, আর event loop ফ্রি থাকবে অন্য কোড চালানোর জন্য।
          fs.unlinkSync(filePath);
          console.log("✅ ফাইল সফলভাবে ডিলিট হয়েছে:", filePath);
        } catch (err) {
          console.error("❌ ফাইল ডিলিট করতে সমস্যা:", err.message);
        }
      }

      // 🔹 ডাটাবেসে array সরাসরি সেভ না করে → JSON string আকারে পাঠানো
      local_file_path = JSON.stringify(localFilePaths);
      photo_url = JSON.stringify(photoUrls);
      console.log('Uploaded URL:', photo_url);
    }

    // ✅ SP কল (১২ প্যারামিটার) — সঠিক অর্ডার মেনে
    const [result] = await conn.query(
      `CALL sp_criminal_info_update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        investigOfficer_id, // 1
        crid,               // 2
        crname,             // 3
        craadhaar,          // 4
        craddress,          // 5
        crphone,            // 6
        crtype,             // 7
        crfir_place,        // 8
        creventdate,        // 9
        creventtime,        // 10
        photo_url,          // 11
        new Date(),         // 12
        local_file_path     // 13
      ]
    );

    console.log("SP Updated Result:", JSON.stringify(result, null, 2));

    if (!result || !result[0] || result[0].length === 0) {
      await conn.rollback();
      return res.status(400).json({ msg: '❌ SP Updated থেকে কোনো ডেটা পাওয়া যায়নি!' });
    }

    await conn.commit();

    const spData = result[0][0]; // প্রথম রো

    res.json({
      msg: '✅ Criminal Record Inserted',
      sp_response: spData
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ msg: '❌ Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// 4. Police & Criminal Specific Record View (Prepared + Token) 🔐 ফাংশন
// POST -  http://localhost:3000/api/criminals/criminalRecordindividualview
// {
//     "investigOfficer_id": "WBCID09082025BANK1",
//     "crid": "27"
// }
export const criminalRecordindividualview = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { investigOfficer_id, crid } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!investigOfficer_id || !crid) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }

    // ✅ SP কল (প্যারামিটার) — সঠিক অর্ডার মেনে
    const [result] = await conn.query(
      `CALL sp_police_criminal_individualview(?,?)`,
      [crid, investigOfficer_id]
    );

    console.log("SP Result:", JSON.stringify(result, null, 2));

    if (!result || !result[0] || result[0].length === 0) {
      await conn.rollback();
      return res.status(400).json({ msg: '❌ Database থেকে কোনো ডেটা পাওয়া যায়নি!' });
    }


    await conn.commit();

    const spstatusData = result[0][0]; // প্রথম রো

    res.json({
      currntmsg: '✅ Individual Record Found',
      sp_response: spstatusData
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ msg: '❌ Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// 5. Police & Criminal All Record View  (Prepared + Token) 🔐 ফাংশন
// POST -  http://localhost:3000/api/criminals/criminalRecordallview
// {
//     "investigOfficer_id": "WBCID09082025BANK1"
// }
export const criminalRecordallview = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { investigOfficer_id } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!investigOfficer_id) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }

    // ✅ SP কল (প্যারামিটার) — সঠিক অর্ডার মেনে
    const [result] = await conn.query(
      `CALL sp_all_criminal_statusview(?)`,
      [investigOfficer_id]
    );

    console.log("SP Result:", JSON.stringify(result, null, 2));

    if (!result || !result[0] || result[0].length === 0) {
      await conn.rollback();
      return res.status(400).json({ msg: '❌ Database থেকে কোনো ডেটা পাওয়া যায়নি!' });
    }

    await conn.commit();

    const spstatusData = result[0]; // All রো

    res.json({
      currntmsg: `✅ All Record Found Based On ${investigOfficer_id}`,
      sp_response: spstatusData
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ msg: '❌ Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// 6. Criminal Record Inactive Secure (Prepared + Token) 🔐 Delete / Inactive ফাংশন
// POST -  http://localhost:3000/api/criminals/criminalRecordStatusChange
export const criminalRecordStatusChange = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { crid, crstatus } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!crid || !crstatus) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }

    // ✅ SP কল (প্যারামিটার) — সঠিক অর্ডার মেনে
    const [result] = await conn.query(
      `CALL sp_set_criminal_status(?, ?)`,
      [crid, crstatus]
    );

    console.log("SP Result:", JSON.stringify(result, null, 2));

    if (!result || !result[0] || result[0].length === 0) {
      await conn.rollback();
      return res.status(400).json({ msg: '❌ SP থেকে কোনো ডেটা পাওয়া যায়নি!' });
    }

    await conn.commit();

    const spstatusData = result[0][0]; // প্রথম রো

    res.json({
      currntmsg: '✅ Criminal Record Status Changed',
      sp_response: spstatusData
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ msg: '❌ Server error', error: err.message });
  } finally {
    conn.release();
  }
};

// 7. 📄 Criminal Report Generate & Download (Puppeteer version) (Prepared + Token)
export const downloadCriminalReportasPDF = async (req, res) => {
  const conn = await pool.getConnection(); // 🔗 Transaction এর জন্য DB connection নেওয়া
  try {
    // 🛡️ Transaction শুরু
    await conn.beginTransaction();
    const { investigOfficer_id, crid } = req.body;
    console.log("Request Body -------->", req.body);
    // ✅ ইনপুট চেক
    if (!investigOfficer_id || !crid) {
      return res.status(400).json({ msg: '❌ Required fields missing!' });
    }
    // 🔍 Stored Procedure দিয়ে Data Fetch
    const [rows] = await conn.query(`CALL sp_get_criminal_info(?, ?)`, [
      crid,     // 2️⃣ ক্রিমিনাল আইডি → নির্দিষ্ট অপরাধী
      investigOfficer_id     // 1️⃣ পুলিশ আইডি → কোন থানার অফিসার

    ]);
    // MySQL procedure result nested array আকারে আসে → আসল ডেটা নিতে rows[0]
    const data = rows[0];
    if (!data || !data.length) {
      await conn.rollback(); // ❌ ডেটা না পেলে Transaction বাতিল
      return res.status(404).json({ msg: "❌ Data Not Found" });
    }

    const criminal = data[0]; // প্রথম রেকর্ড নেওয়া
    console.log("Database Response --> ", criminal);

    // 📂 EJS template এর path তৈরি করা
    const templatePath = path.join(process.cwd(), "views", "criminal-report.ejs");//current working directory,ফোল্ডারের নাম,টেমপ্লেট ফাইলের নাম
    // 🎨 Template এ ডেটা পাঠিয়ে HTML render করা
    const html = await ejs.renderFile(templatePath, { criminal });//H:\workspace2\Criminal\views\criminal-report.ejs ,ওই EJS টেমপ্লেট criminal ডেটা দিয়ে HTML রেন্ডার হবে
    // res.send(html); res.send() হয়ে গেলে আর পরের কোড চলবে না।
    // 🖨️ Puppeteer দিয়ে HTML → PDF বানানো
    const browser = await puppeteer.launch({
      headless: "new", // নতুন Puppeteer headless mode
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", //  Chrome এর path
      args: ["--no-sandbox", "--disable-setuid-sandbox"] // server security flags
    });
    const page = await browser.newPage(); // নতুন পেজ ওপেন
    await page.setContent(html, { waitUntil: "networkidle0" }); // HTML লোড শেষ না হওয়া পর্যন্ত অপেক্ষা

    // 📂 লোকাল টেম্প PDF path
    const pdfPath = path.join("criminaluploads", `criminal_report_${Date.now()}.pdf`);
    console.log("pdfPath -----------------> ", pdfPath);
    const pdfBuffer = await page.pdf({
      path: pdfPath,     // লোকালে PDF সেভ হবে
      format: "A4",      // পেজ সাইজ
      printBackground: true // CSS background print করবে
    });
    await browser.close(); // ব্রাউজার বন্ধ

    // ☁️ PDF Cloudinary তে আপলোড করা  
    const uploadResult = await cloudinaryV2.uploader.upload(pdfPath, {
      folder: "criminal_pdfs",  // 📂 Cloudinary ফোল্ডার 
      resource_type: "raw",      // PDF → raw টাইপ , raw মানে এটা PDF, ZIP, ইত্যাদি non-image ফাইল
      format: "pdf",         // format explicitly pdf সেট করা
      type: "upload"
    });

    // const uploadResult = await new Promise((resolve, reject) => {
    //   const stream = cloudinary.uploader.upload(
    //     {
    //       folder: "criminal_pdfs",  // 📂 Cloudinary ফোল্ডার 
    //       resource_type: "raw",      // PDF → raw টাইপ , raw মানে এটা PDF, ZIP, ইত্যাদি non-image ফাইল
    //       format: "pdf",         // format explicitly pdf সেট করা
    //       type: "upload"
    //     },
    //     (error, result) => {
    //       if (error) return reject(error);
    //       resolve(result);
    //     }
    //   );
    //   streamifier.createReadStream(pdfBuffer).pipe(stream);
    // });
    // console.log("uploadResult -->", uploadResult);

    // 💾 Criminal Description টেবিলে PDF URL সেভ করা
    await conn.query(
      `UPDATE criminal_description SET pdfFile = ?, pdfFilePath = ? WHERE criminal_id = ?`,
      [uploadResult.secure_url, uploadResult.url, crid]
    );

    // ✅ Transaction commit
    await conn.commit();

    // 🧹 লোকাল টেম্প ফাইল ডিলিট করা from criminaluploads Folder
    // fs.unlinkSync(pdfPath);

    // 📤 Response পাঠানো
    res.json({ msg: "✅ PDF Generated & Uploaded", url: uploadResult.secure_url });

  } catch (err) {
    await conn.rollback(); // ❌ সমস্যা হলে transaction revert
    res.status(500).json({ msg: "Server Error", error: err.message });
  } finally {
    conn.release(); // 🔓 Connection রিলিজ
  }
};


// 8. 🔰 Criminal Excel Download Controller ফাংশন
export const downloadCriminalReportasEXCEL = async (req, res) => {
  const { crid } = req.body;                          // ▶️ API URL থেকে criminal_id পাওয়া হচ্ছে (GET /api/criminals/excel/:id)
  console.log("input ----------->",crid);
  if (!crid || isNaN(Number(crid))) {                     // ▶️ Validation: criminal_id সংখ্যা হতে হবে
    return res.status(400).json({ msg: '❌ criminal_id প্রয়োজন এবং এটি একটি সংখ্যা হতে হবে' });
  }

  const conn = await pool.getConnection();            // ▶️ Database Connection নিচ্ছি (transaction লাগছে না, শুধু read)
  try {
    // 1️⃣ Call Stored Procedure ▶️ Stored Procedure কল করা হচ্ছে criminal info + description join ডেটা আনতে
    const [rows] = await conn.query(
      'CALL sp_criminal_full_detailsForExcelView(?)',             // ▶️ MySQL Stored Procedure নাম
      [Number(crid)]                                    // ▶️ Input parameter = criminal_id
    );

    // ▶️ mysql2 CALL এর Result Structure: rows[0] এর ভেতর আসল Data থাকে
    const data = rows && rows[0] ? rows[0] : [];

    if (!data.length) {                               // ▶️ যদি Criminal ID দিয়ে কোনো Data না পাওয়া যায়
      return res.status(404).json({ msg: '❌ কোনো ডেটা পাওয়া যায়নি' });
    }

    // 2️⃣ Create Excel workbook ▶️ নতুন Excel Workbook বানাচ্ছি
    const wb = new ExcelJS.Workbook();                // ▶️ Workbook = পুরো Excel ফাইল
    const ws = wb.addWorksheet('Criminal Report');    // ▶️ Excel শিট তৈরি এবং নাম দেওয়া হলো

    // ▶️ Excel-এর কলাম হেডার (Header) সেট করা হলো , ➡️ কোন কোন কলাম থাকবে, কেমন width হবে সেটা define করা হলো।
    ws.columns = [
      { header: 'Criminal ID',     key: 'criminal_id',    width: 15 },  // ▶️ Criminal টেবিলের ID
      { header: 'Officer ID',      key: 'investigOfficer_id', width: 18 }, // ▶️ কোন অফিসার রেজিস্টার করেছে
      { header: 'Name',            key: 'crname',         width: 18 },  // ▶️ Criminal-এর নাম
      { header: 'Aadhaar',         key: 'craadhaar',      width: 18 },  // ▶️ আধার নম্বর
      { header: 'Address',         key: 'craddress',      width: 25 },  // ▶️ Criminal-এর ঠিকানা
      { header: 'Phone',           key: 'crphone',        width: 15 },  // ▶️ ফোন নাম্বার
      { header: 'Crime Type',      key: 'crtype',         width: 16 },  // ▶️ অপরাধের ধরন
      { header: 'FIR Place',       key: 'crfir_place',    width: 18 },  // ▶️ কোথায় FIR করা হয়েছে
      { header: 'Event Date',      key: 'creventdate',    width: 14 },  // ▶️ অপরাধের তারিখ
      { header: 'Event Time',      key: 'creventtime',    width: 12 },  // ▶️ অপরাধের সময়
      { header: 'Photo URLs',      key: 'photo_urls',     width: 50 },  // ▶️ Criminal Photo-এর Cloudinary URLs (JSON Array → String)
      { header: 'Local Paths',     key: 'local_paths',    width: 50 },  // ▶️ Criminal Photo Local Paths (JSON Array → String)
      { header: 'Created At',      key: 'created_at',     width: 20 },  // ▶️ Criminal Info তৈরি হওয়ার সময়
    ];

    // ▶️ Criminal Info ডেটা প্রতিটি Row হিসেবে Excel-এ বসানো হচ্ছে
    for (const row of data) {
      // ▶️ JSON String কে Array বানাতে হবে (না হলে error হবে)
      const photos = safeParseArray(row.photo_url_json);   // ▶️ Cloudinary Photo URL list
      const locals = safeParseArray(row.local_path_json);  // ▶️ Local Path list

      ws.addRow({
        criminal_id:        row.criminal_id,                     // ▶️ Criminal ID
        investigOfficer_id: row.investigOfficer_id,              // ▶️ Officer ID
        crname:             row.crname,                          // ▶️ Criminal Name
        craadhaar:          row.craadhaar,                       // ▶️ Aadhaar
        craddress:          row.craddress,                       // ▶️ Address
        crphone:            row.crphone,                         // ▶️ Phone Number
        crtype:             row.crtype || '',                    // ▶️ Crime Type (Null হলে খালি দেখাবে)
        crfir_place:        row.crfir_place || '',               // ▶️ FIR Place
        creventdate:        row.creventdate || '',               // ▶️ Event Date
        creventtime:        row.creventtime || '',               // ▶️ Event Time
        photo_urls:         photos.join('\n'),                   // ▶️ একাধিক URL → আলাদা লাইনে
        local_paths:        locals.join('\n'),                   // ▶️ একাধিক Local Path → আলাদা লাইনে
        created_at:         row.created_at                       // ▶️ Created Time
      });
    }

    // ▶️ Excel-এর প্রথম Row (Header Row) Bold করা হলো
    ws.getRow(1).font = { bold: true };

    // 3️⃣ Folder path // path.join(__dirname, "../criminaluploads"); CriminalUploads ফোল্ডার create/check
    const folderPath = path.join(process.cwd(), "criminaluploads");// ➡️ criminaluploads নামে folder project root-এ বানানো হবে (না থাকলে)। process.cwd() → project root directory।
    if (!fs.existsSync(folderPath)) { // উল্লিখিত ফোল্ডারটি আপনার ফাইল সিস্টেমে (file system) আছে কিনা। যদি ফোল্ডারটি না থাকে, তাহলে এটি false রিটার্ন করে। সেই false-কে ! অপারেটর দিয়ে true করা হয়।
      fs.mkdirSync(folderPath);
      // যদি প্রথম ধাপের শর্তটি true হয় (অর্থাৎ ফোল্ডারটি না থাকে), তাহলে fs.mkdirSync() ফাংশনটি folderPath-এ একটি নতুন ফোল্ডার তৈরি করে। 
      // Sync থাকার কারণে এটি সিঙ্ক্রোনাস (synchronous) পদ্ধতিতে কাজ করে, অর্থাৎ ফোল্ডার তৈরি না হওয়া পর্যন্ত কোডের পরবর্তী লাইনগুলো এক্সিকিউট হবে না।
    }

    // 4️⃣ File path
    const filePath = path.join(folderPath, `criminal_${crid}.xlsx`); // ▶️ ফাইলের নাম Criminal ID দিয়ে

    // 5️⃣ Save Excel file
    await wb.xlsx.writeFile(filePath);

    console.log("✅ Excel File Saved:", filePath);

    // 6️⃣ Send download link
    res.json({
      message: "Excel File Ready",
      downloadPath: `/download/${path.basename(filePath)}`// ➡️ Client JSON response পাবে → download path , পরে Express static দিয়ে /download route map করলে ফাইলটা সরাসরি browser-এ download করা যাবে।
    });
  } catch (err) {
    console.error('Excel Download Error:', err);                 // ▶️ Console-এ Error Log
    res.status(500).json({ msg: '❌ সার্ভার ত্রুটি', error: err.message });
  } finally {
    conn.release();                                              // ▶️ Database Connection Release (memory leak হবে না)
  }
};

// 🔧 Utility Function: JSON String → Array (ভুল হলে খালি array রিটার্ন করবে)
function safeParseArray(jsonLike) {
  console.log("jsonLike ->", jsonLike);

  try {
    if (Array.isArray(jsonLike)) {
      // যদি ইতিমধ্যেই Array হয়
      return jsonLike;
    }

    if (typeof jsonLike === "string") {
      // যদি string হয় → parse করে array বানানো
      const parsed = JSON.parse(jsonLike);
      return Array.isArray(parsed) ? parsed : [];
    }

    return []; // অন্য কিছু হলে খালি array
  } catch (err) {
    console.error("safeParseArray error:", err.message);
    return [];
  }
}
