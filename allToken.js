// Prepared Statements = চাবি দিয়ে ব্যাংকের দরজা খোলা (লগইন সিকিউর),লগইনের সময় ইউজার ভেরিফাইড।
// JWT = একবার ঢুকে গেলে তোমাকে একটা আইডি কার্ড দেওয়া হলো (Token),একবার ভেরিফাই হলে পরেরবার শুধু কার্ড দেখালেই চলবে।

// | Feature               | Prepared Statements 🛡️       | JWT 🔐                      |
// | --------------------- | ----------------------------- | --------------------------- |
// | **কোথায় ব্যবহার হয়**  | Database Query                | Frontend ↔ Backend Security |
// | **লক্ষ্য**            | SQL Injection থেকে রক্ষা করা  | ইউজার কে, সেটা চিহ্নিত করা  |
// | **স্টেটফুল/স্টেটলেস** | Stateful (DB connection লাগে) | Stateless (Token দিয়ে হয়)   |
// | **Scope**             | শুধুমাত্র DB Layer            | পুরো API Layer              |
// | **Use Case**          | Login form safe করা           | Login-এর পর API protect করা |

// JWT SIGN = গোপন চাবি দিয়ে Token এর Signature বানানো হয়।
// JWT VERIFY = Signature মিলিয়ে দেখা হয় টোকেন বদলানো হয়েছে কিনা।
// DB CHECK = Token এ যে ডাটা আছে সেটা সত্যি ইউজারের ডাটাবেসে আছে কিনা যাচাই।

// Login → Create Token (with signature)
//         ↓
// Request → Token Verify (Check Signature)
//         ↓
// Decoded Data → police_id, officer_name
//         ↓
// Query DB → মিলিয়ে দেখা
//         ↓
// User Found? ✅ → Allow
// User Not Found? ❌ → Deny

// 🔐 JWT Token Library Import
import jwt from 'jsonwebtoken';
import pool from '../Criminal/services/db.js';

// 🎫 Optional Token Middleware → টোকেন না থাকলেও Guess mode-এ যাবে
export const optionalToken = (req, res, next) => {
  console.log("Token Request Data - ", req);
  const token = req.headers.authorization?.split(" ")[1]; // 🔍 Bearer token split

  if (!token) {
    req.user = null; // Guess mode
    return next();    // ➡️ পরের middleware-এ যাক
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ token থেকে user info রাখা হচ্ছে
    next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid token" }); // ❌ ভুল টোকেন
  }
};

// 🔐 Verify Token Middleware → Must have token (টোকেন থাকতে হবে, না হলে নিষিদ্ধ) , DB checked
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Request Token:", token);

    if (!token) {
      return res.status(403).json({ message: "Token missing" });
    }

    // 🔍 1) Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    console.log("Decoded Token Data:", decoded);

    // 🔍 2) Verify token থেকে পাওয়া তথ্য দিয়ে DB তে মিলিয়ে ইউজার চেক
    //     Login করার সময় jwt.sign() দিয়ে যে Signature সহ Token তৈরি হয়, সেটা রিকোয়েস্টে পাঠানো হয়।
    // Middleware এ jwt.verify() দিয়ে Signature মিলিয়ে দেখা হয় টোকেন আসল কিনা।
    // এরপর decoded ডাটা (যেমন police_id, officer_name) নিয়ে DB থেকে মিলিয়ে দেখা হয়, ইউজার DB তে আছে কিনা।

    // যদি DB তে না পাওয়া যায় → ❌ Access Denied.
    // যদি DB তে পাওয়া যায় → ✅ Access Granted.
    const [rows] = await pool.query("SELECT * FROM police_station WHERE police_id = ? AND officer_name = ?", [decoded.police_id, decoded.officer_name]);
    console.log("Request Token ID Against Database Result - :", rows);
    if (!rows || rows.length === 0) {
      return res.status(403).json({ message: "User not found in database" });
    }

    // ✅ Store user info in req.user
    req.user = rows[0];
    next();

  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
// ✅ Export multiple items in a default object  export default { optionalToken , verifyToken };

// 🔑 ১) শুধু JWT VERIFY() করলে কী হয়?

// jwt.verify() শুধু টোকেনের সিগনেচার (signature) আর expiry date চেক করে।

// এটা প্রমাণ করে যে:

// টোকেন পরিবর্তন হয়নি (কেউ modify করেনি) ✅

// টোকেন মেয়াদোত্তীর্ণ হয়নি ✅

// ⚠️ কিন্তু:

// ইউজার এখনো সিস্টেমে আছে কিনা (DB-তে ইউজার ডিলিট হয়ে গেছে কিনা) তা বোঝে না ❌

// পাসওয়ার্ড চেঞ্জ হলে পুরনো টোকেন এখনো valid দেখাবে ❌

// রোল বা পারমিশন পরিবর্তন হলেও টোকেন আগের তথ্য দেখাবে ❌

// 📌 উদাহরণ:
// পুলিশ আইডি 123 এর টোকেন থাকলেও, যদি ওই পুলিশকে ডাটাবেস থেকে মুছে ফেলা হয়, শুধু jwt.verify() করলে সে এখনো সিস্টেমে ঢুকতে পারবে।

// 🔑 ২) JWT VERIFY() + DB CHECK করলে কী হয়?

// jwt.verify() → সিগনেচার আর expiry যাচাই ✅

// তারপর DB-তে গিয়ে User/Role Active কিনা চেক করা হয় ✅

// User block/delete হলে access deny

// Password change করলে নতুন টোকেন ছাড়া ঢোকা যাবে না

// রোল, পারমিশন সব আপডেটেড থাকবে

// 📌 উদাহরণ:
// পুলিশ আইডি 123 যদি ডাটাবেস থেকে ডিলিট হয়, DB check করলে 403 Forbidden দেবে।

// ⚖️ তুলনা টেবিল:
// Feature	শুধু JWT VERIFY	JWT VERIFY + DB CHECK
// টোকেন সিগনেচার চেক ✅	হ্যাঁ	হ্যাঁ
// Expiry চেক ✅	হ্যাঁ	হ্যাঁ
// User delete/block চেক ❌	না	হ্যাঁ
// Password change detection ❌	না	হ্যাঁ
// Role/Permission আপডেট ❌	না	হ্যাঁ
// নিরাপত্তা লেভেল	Medium	High 🔐

// 🔑 Bottom Line:

// শুধু jwt.verify() যথেষ্ট নয়, কারণ এটা static claim চেক করে।

// প্রোডাকশন লেভেলে সবসময় JWT VERIFY + DB CHECK একসাথে করো।

// ছোট, লাইটওয়েট প্রোজেক্টে শুধু jwt.verify() দিয়ে চলতে পারে, কিন্তু নিরাপত্তা কম।
