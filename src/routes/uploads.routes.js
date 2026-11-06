import { Router } from "express";

import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { uploadProfileImage } from "../middleware/upload.js";
import { uploadProfilePhoto } from "../controllers/uploads.controller.js";

const router = Router();

router.post(
  "/profile",
  verifyFirebaseToken,
  uploadProfileImage,
  uploadProfilePhoto
);

export default router;