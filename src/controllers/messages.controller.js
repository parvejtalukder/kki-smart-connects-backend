import { ObjectId } from "mongodb";
import { getDB } from "../config/mongodb.js";
import { translateText } from "../services/message.services.js";

const users = () => getDB().collection("users");
const messages = () => getDB().collection("messages");

export const createMessage = async (req, res, next) => {
    try {
        
    } catch (error) { 
        
    }
}

export const getUsers = async (req, res, next) => {
  try {

    const firebaseUid = req.user.uid;
    const currentUser = await users().findOne({ firebaseUid });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User profile not found in the database.",
      });
    }

    const filteredUsers = await users()
      .find(
        {
          _id: { $ne: currentUser._id },
          status: "active",
        },
        {
          projection: {
            displayName: 1,
            email: 1,
            photoURL: 1,
            bio: 1,
            role: 1,
            language: 1,
            status: 1,
          },
        }
      )
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      users: filteredUsers,
    });

  } catch (error) {
    next(error);
  }
};

export const getSideConversations = async (req, res, next) => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const currentUser = await users().findOne({ firebaseUid });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const conversations = await messages()
      .aggregate([
        {
          $match: {
            $or: [
              { senderId: currentUser._id },
              { receiverId: currentUser._id },
            ],
          },
        },
        {
          $addFields: {
            otherUserId: {
              $cond: [
                { $eq: ["$senderId", currentUser._id] },
                "$receiverId",
                "$senderId",
              ],
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
            _id: -1,
          },
        },
        {
          $group: {
            _id: "$otherUserId",
            lastMessageAt: { $first: "$createdAt" },
            lastMessageId: { $first: "$_id" },
            lastMessage: { $first: "$text" },
            lastMessageSenderId: { $first: "$senderId" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            _id: "$user._id",
            displayName: "$user.displayName",
            photoURL: "$user.photoURL",
            lastMessageAt: 1,
            lastMessageId: 1,
            lastMessage: 1,
            lastMessageSenderId: 1,
          },
        },
        {
          $sort: {
            lastMessageAt: -1,
            lastMessageId: -1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully.",
      conversations,
    });

  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
  
    const { id: userToChatId } = req.params;
    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const currentUser = await users().findOne({ firebaseUid });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const myId = currentUser._id;
    const allMessages = await messages().find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ]
    }).sort({ createdAt: 1 }).toArray();

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      messages: allMessages,
    });

  } catch (error) {
    next(error)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;

    if (!receiverId || !ObjectId.isValid(receiverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid receiver ID.",
      });
    }

    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const currentUser = await users().findOne({ firebaseUid });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const receiverUser = await users().findOne({
      _id: new ObjectId(receiverId),
    });

    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found.",
      });
    }

    if (currentUser._id.equals(receiverUser._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot send a message to yourself.",
      });
    }

    const senderId = currentUser._id;
    const receiverIdObject = receiverUser._id;

    let textMessage = null;
    let imageMessage = null;

    if (typeof text === "string" && text.trim()) {
      const senderLanguage = currentUser.language || "en";
      const receiverLanguage = receiverUser.language || "en";

      const translatedText = await translateText(
        text.trim(),
        senderLanguage,
        receiverLanguage
      );

      textMessage = {
        originalText: text.trim(),
        translatedText,
        senderLanguage,
        receiverLanguage,
      };
    } else if (image) {
      imageMessage = image;
    } else {
      return res.status(400).json({
        success: false,
        message: "Text or image is required.",
      });
    }

    const newMessage = {
      senderId,
      receiverId: receiverIdObject,
      textMessage,
      imageMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await messages().insertOne(newMessage);

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: {
        _id: result.insertedId,
        ...newMessage,
      },
    });
  } catch (error) {
    next(error);
  }
};
