import { Router } from "express";
import { createMessage, getMessages, getSideConversations, getUsers, sendMessage } from "../controllers/messages.controller.js";
import verifyFirebaseToken from "../middleware/verifyFirebaseToken.js";

const router = Router();
router.post("/create", verifyFirebaseToken, createMessage);
router.get("/users", verifyFirebaseToken, getUsers);
router.get("/:id", verifyFirebaseToken, getMessages);
router.get("/conversations", verifyFirebaseToken, getSideConversations)
router.get("/send/:id", verifyFirebaseToken, sendMessage);


export default router;