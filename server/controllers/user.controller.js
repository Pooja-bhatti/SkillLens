import User from "../models/usermodel.js"



export const getCurrentUser=async (req,res) => {
    try {
        const userid=req.user.id
        const user=await User.findById(userid).select("-__v")
        if(!user){
            return res.status(404).json({message:"user with user id not found"})
        }
        return res.status(200).json(user)
    } catch (error) {
        console.error("Get current user error:", error)
        return res.status(401).json({message:"Get current user error"})
    }
}

export const buyCredits=async (req,res) => {
    try {
        const userid=req.userId
        const { credits } = req.body
        if (!credits || typeof credits !== 'number') {
            return res.status(400).json({message:"Invalid credits value"})
        }
        const user=await User.findById(userid)
        if(!user){
            return res.status(404).json({message:"user with user id not found"})
        }
        user.credits += credits
        await user.save()
        return res.status(200).json({ message: "Credits updated successfully", credits: user.credits })
    } catch (error) {
        return res.status(400).json({message:"Buy credits error"})
    }
}