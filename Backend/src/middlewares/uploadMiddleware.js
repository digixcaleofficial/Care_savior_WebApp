const multer = require('multer');
const path = require('path');

// 1. Storage Engine (Server pe file kahan save hogi temporarily)
// Hum memory (RAM) use nahi kar rahe, disk use kar rahe hain taaki server heavy na ho
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // 'uploads' folder mein file jayegi
  },
  filename: function (req, file, cb) {
    // File ka naam unique bana rahe hain (Time + Original Name)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// 2. Filter (Sirf Images aur PDFs allow karenge)
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|pdf/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Images and PDFs only!'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

module.exports = upload;