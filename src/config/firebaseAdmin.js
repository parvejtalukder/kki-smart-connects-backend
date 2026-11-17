import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

const getFirebaseCredential = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    return applicationDefault();
  }

  try {
    return cert(JSON.parse(serviceAccountJson));
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_JSON is not valid service-account JSON: ${error.message}`,
    );
  }
};

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: getFirebaseCredential(),
      });

export const adminAuth = getAuth(firebaseApp);