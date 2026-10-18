import { adminAuth } from "../config/firebaseAdmin.js";

const verifyFirebaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }
    try {
      const token = authorization.slice(7);
      req.user = await adminAuth.verifyIdToken(token);
      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }
};

export default verifyFirebaseToken;