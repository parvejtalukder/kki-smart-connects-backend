import multer from "multer";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error(
        "Only JPEG, PNG, or WebP images are allowed."
      );
      error.code = "INVALID_FILE_TYPE";
      return cb(error);
    }

    cb(null, true);
  },
});

export const uploadProfileImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(413).json({
        success: false,
        message: "Image must be 5 MB or smaller.",
      });
    }

    if (error.code === "INVALID_FILE_TYPE") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  });
};