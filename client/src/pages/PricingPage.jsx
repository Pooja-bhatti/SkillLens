import React, { useState } from 'react'
import Navbar from '../components/Navbar'
import { motion, AnimatePresence } from 'motion/react'
import { useSelector, useDispatch } from 'react-redux'
import { LiaCoinsSolid } from "react-icons/lia"
import { FaCheck, FaInfoCircle, FaFileAlt } from 'react-icons/fa'
import { BsArrowRight, BsSliders, BsShieldCheck } from 'react-icons/bs'
import { setUserData } from '../redux/userSlice'
import axios from 'axios'
import { ServerUrl } from '../App'
import AuthModel from '../components/AuthModel'

const PACKAGES = [
  {
    name: "Starter Bundle",
    price: 499,
    credits: 200,
    assessmentsCount: "~4 full sessions",
    desc: "Perfect for parsing initial candidate pipelines or trials.",
    features: [
      "Resume claims validation",
      "Core Technical CS track access",
      "STAR HR interview behavioral track",
      "Detailed scorecard grading transcripts",
      "Standard email response logs"
    ]
  },
  {
    name: "Growth Scale",
    price: 1499,
    credits: 750,
    assessmentsCount: "~15 full sessions",
    desc: "For active tech recruiter managers hiring developers.",
    features: [
      "Everything in Starter, plus:",
      "Coding DSA sandbox tracks",
      "Custom skill tag chip modification",
      "Confidence vs mastery competency mapping",
      "Priority customer queue support"
    ],
    recommended: true
  },
  {
    name: "Enterprise Volume",
    price: 4999,
    credits: 3000,
    assessmentsCount: "~60 full sessions",
    desc: "For scale recruitment agencies conducting bulk cycles.",
    features: [
      "Everything in Growth, plus:",
      "Custom weighting settings per concept",
      "Multiple user profile permissions",
      "Priority FSM queuing thresholds",
      "Full API analytics exports"
    ]
  }
]

// Dynamic script loader for Razorpay checkout window
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function PricingPage() {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()

  const [loadingIndex, setLoadingIndex] = useState(null)
  const [successCredits, setSuccessCredits] = useState(null)
  const [showAuth, setAuth] = useState(false)

  const handlePurchase = async (pkg, idx) => {
    if (!userData) {
      setAuth(true)
      return
    }

    setLoadingIndex(idx)
    try {
      // 1. Ask server to create order details
      const orderRes = await axios.post(
        `${ServerUrl}/api/payment/order`,
        { price: pkg.price },
        { withCredentials: true }
      )

      const { orderId, amount, currency, keyId, isMock } = orderRes.data;

      // 2. Fallback sandbox simulation if no real credentials are set in .env
      if (isMock) {
        const verifyRes = await axios.post(
          `${ServerUrl}/api/payment/verify`,
          {
            razorpay_order_id: orderId,
            razorpay_payment_id: "pay_mockPaymentId123",
            razorpay_signature: "signature_mockSignature123",
            credits: pkg.credits,
            isMock: true
          },
          { withCredentials: true }
        )

        dispatch(setUserData({ ...userData, credits: verifyRes.data.credits }))
        setSuccessCredits(pkg.credits)
        setTimeout(() => setSuccessCredits(null), 3000)
        setLoadingIndex(null)
        return
      }

      // 3. Load script for real transaction modal popup
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Failed to load Razorpay payment gateway script. Check connection.");
        setLoadingIndex(null);
        return;
      }

      // 4. Initialize Razorpay widget options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SkillLens AI Platform",
        description: `Purchase of ${pkg.credits} recruiter credits`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoadingIndex(idx)
            const verifyRes = await axios.post(
              `${ServerUrl}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits: pkg.credits,
                isMock: false
              },
              { withCredentials: true }
            )

            dispatch(setUserData({ ...userData, credits: verifyRes.data.credits }))
            setSuccessCredits(pkg.credits)
            setTimeout(() => setSuccessCredits(null), 3000)
          } catch (err) {
            console.error("Payment validation failed:", err)
            alert("Verification failed. Please contact Support.")
          } finally {
            setLoadingIndex(null)
          }
        },
        prefill: {
          name: userData.name,
          email: userData.email,
        },
        theme: {
          color: "#D77054" // terracotta color highlight
        },
        modal: {
          ondismiss: function () {
            setLoadingIndex(null)
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Transaction initialization failed:", error)
      alert("Failed to initialize payment transaction.")
      setLoadingIndex(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <Navbar />

      <div className="pl-64 min-h-screen p-8 max-w-7xl mx-auto w-full space-y-10">
        
        {/* Banner header */}
        <div className="border-b border-border-main/50 pb-6 text-center md:text-left">
          <h1 className="text-2xl font-black tracking-tight text-text-primary">Billing & Credit Plans</h1>
          <p className="text-xs text-text-secondary mt-1 max-w-2xl">
            Acquire credits to query candidate resumes and generate custom FSM assessment rooms. Adaptive tracks cost 50 credits per session.
          </p>
        </div>

        {/* Available Credits Dashboard Widget */}
        {userData && (
          <div className="bg-card-main border border-border-main p-5 rounded-2xl flex items-center justify-between shadow-sm max-w-md mx-auto md:mx-0">
            <div className="flex items-center gap-3">
              <div className="bg-secondary-accent/15 text-secondary-accent p-3 rounded-xl">
                <LiaCoinsSolid size={24} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Your Balance</p>
                <p className="text-xl font-black text-text-primary mt-0.5">{userData.credits} Credits</p>
              </div>
            </div>
            <span className="text-[9px] bg-brand-success/15 text-brand-success border border-brand-success/20 px-2.5 py-1 rounded-full font-bold uppercase">
              Recruiter Active
            </span>
          </div>
        )}

        {/* Pricing Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch pt-2">
          {PACKAGES.map((pkg, idx) => {
            const isLg = pkg.recommended;
            return (
              <div 
                key={idx}
                className={`bg-card-main border rounded-2xl p-6 flex flex-col justify-between shadow-sm relative transition duration-200 hover:shadow-md ${
                  isLg ? 'border-primary-accent ring-1 ring-primary-accent/15' : 'border-border-main'
                }`}
              >
                {/* Recommended tag pill */}
                {isLg && (
                  <span className="absolute -top-3.5 left-6 bg-primary-accent text-white border border-primary-accent/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div>
                  {/* Name & price */}
                  <div>
                    <h3 className="font-black text-sm text-text-primary uppercase tracking-wider">{pkg.name}</h3>
                    <p className="text-text-secondary text-[10px] leading-relaxed mt-1">{pkg.desc}</p>
                  </div>

                  <div className="my-6 border-b border-border-main/50 pb-5 space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-text-primary">₹{pkg.price}</span>
                      <span className="text-text-secondary text-xs font-semibold">one-time</span>
                    </div>
                    <p className="text-xs font-bold text-primary-accent flex items-center gap-1.5 pt-1">
                      <LiaCoinsSolid size={18} /> {pkg.credits} Credits ({pkg.assessmentsCount})
                    </p>
                  </div>

                  {/* Bullet features */}
                  <ul className="space-y-2.5 text-xs text-text-secondary mb-8">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <FaCheck className="text-brand-success mt-0.5 flex-shrink-0" size={10} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action */}
                <button
                  disabled={loadingIndex !== null}
                  onClick={() => handlePurchase(pkg, idx)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                    isLg 
                      ? 'bg-primary-accent text-white hover:opacity-95' 
                      : 'bg-bg-secondary text-text-primary border border-border-main hover:bg-border-main/50'
                  }`}
                >
                  {loadingIndex === idx ? (
                    <><span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" /> Verifying...</>
                  ) : (
                    <>Add {pkg.credits} Credits <BsArrowRight /></>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Secure Transaction Alert */}
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-2 text-[10px] text-text-secondary bg-bg-secondary/40 border border-border-main p-3 rounded-xl max-w-md">
            <BsShieldCheck className="text-brand-success" size={18} />
            <p>Mock payments enabled. Adding credits directly communicates with your developer user profile in the database.</p>
          </div>
        </div>

      </div>

      {/* Success alert toast modal popup */}
      <AnimatePresence>
        {successCredits && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 right-8 bg-[#2B2A28] border border-border-main text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3 max-w-sm"
          >
            <LiaCoinsSolid size={24} className="text-secondary-accent animate-bounce" />
            <div className="text-xs">
              <p className="font-bold text-white">Purchase Successful!</p>
              <p className="text-[#A39E93] mt-0.5">{successCredits} credits added to your profile balance.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth trigger overlay */}
      {showAuth && (
        <AuthModel onClose={() => setAuth(false)} />
      )}
    </div>
  )
}

export default PricingPage
