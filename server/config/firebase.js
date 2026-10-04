const admin = require('firebase-admin');

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;

  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️  Firebase credentials not configured — push notifications disabled');
    }
  } catch (error) {
    console.error('⚠️  Firebase initialization failed:', error.message);
  }
};

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.log('📱 Push notification (stub):', { title, body, data });
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    };
    const response = await admin.messaging().send(message);
    console.log('📱 Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return null;
  }
};

module.exports = { initFirebase, sendPushNotification };
