import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

interface CustomRequest extends Request {
  userId?: string;
}

export const userMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): void => {
  const header = req.headers["authorization"];

  if (!header) {
    res
      .status(401)
      .json({ message: "Authorization header missing or invalid" });
  }

  try {
    const decoded = jwt.verify(header as string, JWT_SECRET) as { id: string };

    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(403).json({
      message: "You are not logged in or token is invalid",
    });
  }
};
