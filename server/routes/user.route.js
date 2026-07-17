import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { getCurrentUser, buyCredits } from "../controllers/user.controller.js"
const userRouter=express.Router()
userRouter.get("/current-user",isAuth,getCurrentUser)
userRouter.post("/buy-credits",isAuth,buyCredits)

export default userRouter