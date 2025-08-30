import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

try {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0
  });

  console.log("✅ MySQL Pool Created Successfully!");
} catch (error) {
  console.error("❌ MySQL Pool Creation Failed:", error.message);
  process.exit(1); // 🔴 Exit the app if DB setup fails
}

export default pool;
