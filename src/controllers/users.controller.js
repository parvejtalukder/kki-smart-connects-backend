import { getDB } from "../config/mongodb.js";

const users = () => getDB().collection("users");

const MAX_SOCIAL_LINKS = 10;
const PLATFORM_KEY = /^[a-z0-9_-]{1,30}$/;
const ALLOWED_GENDERS = new Set(["", "male", "female", "other"]);

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeSocialLinks = (input) => {
  if (input === undefined) return undefined;

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const entries = Object.entries(input);

  if (entries.length > MAX_SOCIAL_LINKS) {
    return null;
  }

  const links = {};

  for (const [rawPlatform, rawUrl] of entries) {
    const platform = String(rawPlatform).trim().toLowerCase();

    if (!PLATFORM_KEY.test(platform)) return null;
    if (platform in links) return null;
    if (typeof rawUrl !== "string" || !isHttpUrl(rawUrl)) return null;

    links[platform] = rawUrl.trim();
  }

  return links;
};

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
    const firebaseUid = req.user.uid;

    if (!firebaseUid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { language } = req.body;

    if (typeof language !== "string" || !/^[a-z]{2,3}$/.test(language)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid language code.",
      });
    }

    const user = await users().findOneAndUpdate(
      { firebaseUid },
      {
        $set: {
          language,
          updatedAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        projection: { _id: 0 },
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { uid, email } = req.user;

    if (!uid || !email) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const body = req.body || {};
    const updates = {};

    if (body.displayName !== undefined) {
      if (typeof body.displayName !== "string") {
        return res.status(400).json({
          success: false,
          message: "Display name must be text.",
        });
      }

      const displayName = body.displayName.trim();

      if (!displayName || displayName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Display name must be between 1 and 100 characters.",
        });
      }

      updates.displayName = displayName;
    }

    if (body.bio !== undefined) {
      if (typeof body.bio !== "string" || body.bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Bio must be text no longer than 500 characters.",
        });
      }

      updates.bio = body.bio.trim();
    }

    if (body.gender !== undefined) {
      if (typeof body.gender !== "string" || !ALLOWED_GENDERS.has(body.gender)) {
        return res.status(400).json({
          success: false,
          message: "Please choose a valid gender.",
        });
      }

      updates.gender = body.gender;
    }

    if (body.socialLinks !== undefined) {
      const socialLinks = normalizeSocialLinks(body.socialLinks);

      if (!socialLinks) {
        return res.status(400).json({
          success: false,
          message:
            "Social links must map platform names to http(s) URLs (maximum 10).",
        });
      }

      updates.socialLinks = socialLinks;
    }

    if (body.photoURL !== undefined) {
      if (body.photoURL === null || body.photoURL === "") {
        updates.photoURL = null;
      } else if (
        typeof body.photoURL === "string" &&
        isHttpUrl(body.photoURL)
      ) {
        updates.photoURL = body.photoURL.trim();
      } else {
        return res.status(400).json({
          success: false,
          message: "Profile photo URL must be a valid http(s) URL.",
        });
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided.",
      });
    }

    const now = new Date();
    updates.updatedAt = now;

    // Seeds a Mongo document for accounts that only exist in Firebase
    // (for example Google sign-in) instead of silently dropping the update.
    const insertDefaults = {
      firebaseUid: uid,
      email,
      displayName: "",
      bio: "",
      gender: "",
      photoURL: null,
      language: "",
      phoneNumber: null,
      role: "reader",
      status: "active",
      socialLinks: {},
      createdAt: now,
      lastLoginAt: now,
    };

    const setOnInsert = Object.fromEntries(
      Object.entries(insertDefaults).filter(([key]) => !(key in updates))
    );

    const user = await users().findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates, $setOnInsert: setOnInsert },
      {
        upsert: true,
        returnDocument: "after",
        projection: { _id: 0 },
      }
    );

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};
