import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/usermodel.js';
import gentoken from '../config/token.js';

let cachedPublicKeys = null;
let cacheExpiryTime = 0;

// Fetch Google's public key certificates for Firebase Auth signature verification
const getGooglePublicKeys = async () => {
  if (cachedPublicKeys && Date.now() < cacheExpiryTime) {
    return cachedPublicKeys;
  }
  const response = await axios.get(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  cachedPublicKeys = response.data;
  // Cache the keys for 1 hour to prevent redundant HTTP requests
  cacheExpiryTime = Date.now() + 3600 * 1000;
  return cachedPublicKeys;
};

// Cryptographically verify the client Firebase ID Token
const verifyFirebaseIdToken = async (idToken) => {
  // 1. Decode token to inspect the header for 'kid' (key identifier)
  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || !decoded.header || !decoded.header.kid) {
    throw new Error('Invalid token structure or missing header key id (kid)');
  }

  // 2. Fetch Google's public keys and locate the matching public certificate
  const keys = await getGooglePublicKeys();
  const publicKeyCert = keys[decoded.header.kid];
  if (!publicKeyCert) {
    throw new Error('Public certificate not found for key identifier (kid)');
  }

  // 3. Verify signature, expiration, and audience claims
  const projectId = 'interviewiq-28c73';
  const verifyOptions = {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`
  };

  return jwt.verify(idToken, publicKeyCert, verifyOptions);
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'ID Token is required' });
    }

    // Cryptographically verify ID Token signature and claims
    const decodedToken = await verifyFirebaseIdToken(idToken);
    const { name, email } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: 'Email scope missing from Google token' });
    }

    // Upsert user details
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: name || email.split('@')[0], email });
    }
    const token = await gentoken(user._id);

    // Save token in cookie
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json(user);

  } catch (error) {
    console.error('=== GOOGLE AUTH FAILURE ===');
    console.error('Message:', error.message);
    console.error('Name:', error.name);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('HTTP Response:', JSON.stringify(error.response.data));
    }
    console.error('===========================');
    return res.status(401).json({ message: `Google authentication failed: ${error.message}` });
  }
};

export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax'
    });
    return res.status(200).json({ message: 'Logout success' });
  } catch (error) {
    return res.status(500).json({ message: `Log out error ${error.message}` });
  }
};
