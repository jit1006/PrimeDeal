import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config/varibles";

declare global{
    namespace Express{
        interface Request{
            id: string;
        }
    }
}

export const isAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        if (!token) {
            res.status(401).json({ success: false, message: "User Unauthorized" });
            return;
        }

        //verify token
        const decode = jwt.verify(token, SECRET_KEY) as jwt.JwtPayload;

        //check if decoding is successful
        if (!decode) {
            res.status(401).json({ success: false, message: "Invalid token" });
            return;
        }
        req.id = decode.userId;
        next();
    } catch (error) {
        console.log("Middleware Error : ", error)
        res.status(401).json({ success:false,message: "Unauthorized" });
        return;
    }
}