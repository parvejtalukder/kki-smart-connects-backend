import { getDB } from "../config/mongodb.js";

const users = () => getDB().collection("users");

export const getMyProfile = async (req, res, next) => {
  try {
    const user = await users().findOne(
      { firebaseUid: req.user.uid }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const putUserDb = async (req, res, next) => {
    try {
        const { uid, email } = req.user;
        const { displayName, photoURL } = req.body;

        if (!uid || !email) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const usersCollection = getDB().collection("users");

        const existingUser = await usersCollection.findOne({
            $or: [
                { firebaseUid: uid },
                { email: email },
            ],
        });

        const now = new Date();

        if (!existingUser) {
            const userModel = {
                firebaseUid: uid,
                displayName: displayName || "",
                email: email,
                photoURL: photoURL,
                bio: "Give Your Short Bio Here!",
                role: "reader",
                status: "active",
                gender: "",
                language: "",
                phoneNumber: null,
                socialLinks: [],
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now,
            };

            await usersCollection.insertOne(userModel);

            return res.status(201).json({
                success: true,
                message: "User registered successfully.",
                user: {
                    ...userModel,
                    _id: undefined,
                },
            });
        }

        if (
            existingUser.firebaseUid !== uid ||
            existingUser.email !== email
        ) {
            return res.status(409).json({
                success: false,
                message: "This email or account is already registered.",
            });
        }

        await usersCollection.updateOne(
            { firebaseUid: uid },
            {
                $set: {
                    email,
                    displayName: displayName ?? existingUser.displayName,
                    photoURL: photoURL ?? existingUser.photoURL,
                    updatedAt: now,
                    lastLoginAt: now,
                },
            }
        );

        const user = await usersCollection.findOne(
            { firebaseUid: uid },
            { projection: { _id: 0 } }
        );

        return res.status(200).json({
            success: true,
            message: "User profile synchronized successfully.",
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const updateMyLanguage = async (req, res, next) => {
  try {

    const { language } = req.body;
    if (typeof language !== "string" || !/^[a-z]{2,3}$/.test(language)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid language code.",
      });
    }

    const firebaseUid = req.user.uid;

    const result = await users().updateOne(
      { firebaseUid },
      {
        $set: {
          language,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: {
          firebaseUid: 1,
          displayName: 1,
          email: 1,
          language: 1,
          updatedAt: 1,
        },
      }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully.",
      user: result,
    });
  } catch (error) {
    next(error);
  }
};