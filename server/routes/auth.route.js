import express from "express"
import {googleAuth, logout} from "../controllers/auth.controller.js"
const authrouter= express.Router()
authrouter.post("/google",googleAuth)
authrouter.get("/logout",logout)
export default authrouter
