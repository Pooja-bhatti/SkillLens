import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
// Force load ALL vars from .env — override any previously injected values (e.g. dotenvx)
dotenv.config({ path: resolve(__dirname, ".env"), override: true });
console.log(process.env.RAZORPAY_KEY_ID);
console.log(process.env.RAZORPAY_KEY_SECRET);

import express from "express";
import connectDb from "./config/connectDB.js";
import cookieParser from "cookie-parser";
import cors from "cors"
import authrouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import paymentRouter from "./routes/payment.route.js";
import { warmupEmbeddingModel } from "./services/embeddingService.js";

const app=express()
app.use(cors({
    origin:"https://skilllens-1client.onrender.com",
    credentials:true
}))

app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authrouter)
app.use("/api/user",userRouter)
app.use("/api/interview",interviewRouter)
app.use("/api/payment",paymentRouter)
const PORT=process.env.PORT || 6000

app.listen(PORT,()=>{
    console.log( `server runing on port ${PORT}`)
    connectDb()
    // Pre-warm Transformers.js model (downloads ~90MB once, then cached)
    warmupEmbeddingModel().catch(console.error)
})
