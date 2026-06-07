/**
 * upload.js
 * Multer + Cloudinary storage middleware for room image uploads.
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * Exports:
 *   uploadRoomImages  – multer middleware (field: "images", max: 10 files)
 *   deleteImage(publicId) – removes a Cloudinary asset by its public_id
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ---------------------------------------------------------------------------
// 1. Configure Cloudinary
// ---------------------------------------------------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// 2. CloudinaryStorage — stores images in the adane-hotel/rooms folder
// ---------------------------------------------------------------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'adane-hotel/rooms',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
  },
});

// ---------------------------------------------------------------------------
// 3. File filter – images only
// ---------------------------------------------------------------------------
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error('Only JPEG, PNG and WebP images are allowed'), {
        statusCode: 400,
      }),
      false
    );
  }
};

// ---------------------------------------------------------------------------
// 4. Export: uploadRoomImages
//    Field name : "images"
//    Max files  : 10
//    Max size   : 5 MB each
// ---------------------------------------------------------------------------
const uploadRoomImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files:    10,
  },
}).array('images', 10);

// ---------------------------------------------------------------------------
// 5. Export: deleteImage(publicId)
// ---------------------------------------------------------------------------
const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result; // { result: 'ok' } on success
};

module.exports = {
  uploadRoomImages,
  deleteImage,
};
