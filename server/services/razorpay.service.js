import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to manually load keys in case dotenv hasn't populated process.env yet
export const getRazorpayKeys = () => {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const keys = {};
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      keys[key] = value;
    }
    return {
      keyId: keys['RAZORPAY_KEY_ID'] || process.env.RAZORPAY_KEY_ID || '',
      keySecret: keys['RAZORPAY_KEY_SECRET'] || process.env.RAZORPAY_KEY_SECRET || ''
    };
  } catch (err) {
    console.error('Failed to read .env for Razorpay keys:', err.message);
    return { keyId: process.env.RAZORPAY_KEY_ID || '', keySecret: process.env.RAZORPAY_KEY_SECRET || '' };
  }
};

export const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!keyId || !keySecret) {
    console.warn("Razorpay keys are missing. Instance will not be created.");
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
};
