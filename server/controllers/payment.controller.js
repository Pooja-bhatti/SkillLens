import crypto from 'crypto';
import User from '../models/usermodel.js';
import { getRazorpayInstance, getRazorpayKeys } from '../services/razorpay.service.js';


export const createOrder = async (req, res) => {
  try {
    const { price } = req.body;
    if (!price || typeof price !== 'number') {
      return res.status(400).json({ message: 'Invalid price value' });
    }

    const { keyId, keySecret } = getRazorpayKeys();
    console.log('Razorpay keyId loaded:', keyId ? `YES (${keyId.substring(0, 12)}...)` : 'NO — MISSING');

    if (!keyId || !keySecret) {
      return res.status(200).json({
        isMock: true,
        orderId: `order_mock_${Math.random().toString(36).substring(7)}`,
        amount: price * 100,
        currency: 'INR',
        keyId: 'rzp_test_mockKeyId123'
      });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({ message: "Failed to initialize Razorpay" });
    }
    const order = await razorpay.orders.create({
      amount: price * 100,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    });

    return res.status(200).json({
      isMock: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId
    });

  } catch (error) {
    console.log("=========== RAZORPAY ERROR ===========");
    console.log(error);

    console.log("Message:", error.message);
    console.log("Status:", error.statusCode);
    console.log("Error:", error.error);

    return res.status(error.statusCode || 500).json({
      message: error.message,
      status: error.statusCode,
      error: error.error,
      full: error
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits, isMock } = req.body;
    const userid = req.user.id;

    const user = await User.findById(userid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Bypass signature check in mock mode
    if (isMock) {
      user.credits += credits;
      await user.save();
      return res.status(200).json({
        message: 'Payment simulated (Sandbox Mode)',
        credits: user.credits
      });
    }

    // Cryptographic signature verification
    const { keySecret } = getRazorpayKeys();
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
    const generated_signature = hmac.digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature. Verification failed.' });
    }

    user.credits += credits;
    await user.save();

    return res.status(200).json({
      message: 'Payment verified and credits added successfully',
      credits: user.credits
    });

  } catch (error) {
    console.error('Razorpay verifyPayment error:', error);
    return res.status(400).json({ message: 'Failed to verify payment' });
  }
};
