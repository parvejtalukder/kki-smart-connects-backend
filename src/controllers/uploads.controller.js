import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "kki/profiles",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          return reject(error || new Error("Cloudinary upload failed."));
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

export const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required.",
      });
    }

    if (!detectImageType(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "File is not a valid JPEG, PNG, or WebP image.",
      });
    }

    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        success: false,
        message: "Image storage is not configured.",
      });
    }

    const url = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully.",
      data: { url },
    });
  } catch (error) {
    console.error("Profile photo upload failed:", error);

    return res.status(502).json({
      success: false,
      message: "Image upload failed. Please try again.",
    });
  }
};