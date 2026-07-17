import jwt from "jsonwebtoken"

//from token find user id 
const isAuth = async (req, res, next) => {
    try {
        let { token } = req.cookies
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Token not found" })
        }
        const verifyToken = jwt.verify(token, process.env.JWT_SECRET)
        if (!verifyToken || !verifyToken.userid) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" })
        }
        
        req.userId = verifyToken.userid
        req.user = { id: verifyToken.userid }
        next()

    } catch (error) {
        console.error("Auth middleware signature error:", error)
        return res.status(401).json({ message: `Unauthorized: Token expired or invalid` })
    }
}
export default isAuth