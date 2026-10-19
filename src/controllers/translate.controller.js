import { ObjectId } from "mongodb";
import { translateText } from "../services/message.services.js";
import { getDB } from "../config/mongodb.js";

const users = () => getDB().collection("users");

export const translateMessageTo = async (req, res, next) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    console.log("COL")
    if (!sourceLanguage || !targetLanguage) {
        return res.status(401).json({
            success: false,
            message: "Languages required.",
        });
    }

    const translatedText = await translateText(
      text,
      sourceLanguage,
      targetLanguage
    );

    return res.status(200).json({
      success: true,
      data: {
        originalText: text.trim(),
        translatedText,
        sourceLanguage,
        targetLanguage,
      },
    });
  } catch (error) {
    next(error);
  }
};