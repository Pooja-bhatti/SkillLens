import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { analyzResume, finishInterview, generateQuestion, getHistory, submitAnswer } from "../controllers/interview.controller.js"

const interviewRouter=express.Router()
interviewRouter.post("/resume",isAuth,upload.single("resume"),analyzResume)
interviewRouter.post("/generate-questions",isAuth,generateQuestion)
interviewRouter.post("/submit-answer",isAuth,submitAnswer)
interviewRouter.post("/finish",isAuth,finishInterview)
interviewRouter.get("/history",isAuth,getHistory)


export default interviewRouter