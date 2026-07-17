import { initializeApp, getApps } from 'firebase-admin/app';
import admin from 'firebase-admin';

// Verify and initialize Firebase Admin SDK for ESM
if (getApps().length === 0) {
  initializeApp({
    projectId: 'interviewiq-28c73'
  });
}

export default admin;
