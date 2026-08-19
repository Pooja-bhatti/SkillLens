import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { executeCode } from "../controllers/code.controller.js"

const codeRouter = express.Router()
codeRouter.post("/execute", isAuth, executeCode)

export default codeRouter
