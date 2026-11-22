import { Router } from "express";

import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { getMyProfile, putUserDb, updateMyLanguage, updateProfile} from "../controllers/users.controller.js";

const router = Router();
router.get("/me", verifyFirebaseToken, getMyProfile);
router.put("/me", verifyFirebaseToken, putUserDb);
router.patch("/me", verifyFirebaseToken, updateProfile);
router.patch("/update/language", verifyFirebaseToken, updateMyLanguage);

export default router;