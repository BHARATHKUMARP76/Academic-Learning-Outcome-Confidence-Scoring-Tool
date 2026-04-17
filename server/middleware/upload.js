const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const uploadDestination = 'uploads/';

// Ensure uploads directory exists at startup
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    // Extra safety: make sure directory still exists
    fs.mkdir(uploadsDir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadDestination);
    });
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const mime = file.mimetype;
  const isPdf = mime === 'application/pdf';
  const isImage = /^image\//.test(mime);

  if (req.uploadContext === 'achievement') {
    if (!isPdf) return cb(new Error('Only PDF certificates allowed'), false);
    return cb(null, true);
  }

  if (req.uploadContext === 'activity') {
    if (!isPdf && !isImage) return cb(new Error('Only PDF or image files allowed'), false);
    return cb(null, true);
  }

  // default: allow PDFs only if no explicit context
  if (!isPdf) return cb(new Error('Only PDF files allowed'), false);
  return cb(null, true);
}

const upload = multer({ storage, fileFilter });

module.exports = { upload };

