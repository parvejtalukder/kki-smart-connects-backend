import { Router } from "express";
import { getUsers, getSideConversations, getMessages, sendMessage,
} from "../controllers/messages.controller.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";

const router = Router();

router.get("/users", verifyFirebaseToken, getUsers);
router.get("/conversations", verifyFirebaseToken, getSideConversations);
router.get("/:id", verifyFirebaseToken, getMessages);
router.post("/send/:id", verifyFirebaseToken, sendMessage);

export default router;
