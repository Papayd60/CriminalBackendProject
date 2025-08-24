// 🔐 JWT Token Library Import
import jwt from 'jsonwebtoken';

// 🎫 Optional Token Middleware → টোকেন না থাকলেও Guess mode-এ যাবে
export const optionalToken = (req, res, next) => {
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

// 🔐 Verify Token Middleware → টোকেন থাকতে হবে, না হলে নিষিদ্ধ
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Request Token - ",token);
  if (!token) return res.status(403).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
    req.user = decoded; // ✅ যাচাইকৃত user data
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


export default verifyToken ;
// ✅ Export multiple items in a default object  export default { optionalToken , verifyToken };
