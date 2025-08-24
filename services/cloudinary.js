import cloudinary from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// v2 config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Normal config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // ☁️ Cloud Name
  api_key: process.env.CLOUDINARY_API_KEY,       // 🔑 API Key
  api_secret: process.env.CLOUDINARY_API_SECRET, // 🛡️ API Secret
});

// দুটোই একসাথে export করো
export default {
  cloudinary,
  cloudinaryV2: cloudinary.v2
};

