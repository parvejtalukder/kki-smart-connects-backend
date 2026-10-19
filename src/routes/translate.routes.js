import { Router } from "express";

// import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";
import { translateMessageTo } from "../controllers/translate.controller.js";

const router = Router();
router.get("/get", translateMessageTo);

export default router;