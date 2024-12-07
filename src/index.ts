import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import z from "zod";
import bcrypt from "bcrypt";
import UserModel, { IUser } from "./db";
import dotenv from "dotenv";

require("dotenv").config();

const app = express();

const mongodbUrl = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET key variable is not defined");
}

if (!mongodbUrl) {
  throw new Error("MONGODB_URL environment variable is not defined");
}

mongoose
  .connect(mongodbUrl)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
  try {
    const formValidation = z.object({
      username: z.string().min(1, "name is required"),
      password: z.string().min(7, "Min is 7").max(15, "Max is 15"),
      email: z.string().email(),
    });
    const { username, password, email } = req.body;

    const check = formValidation.safeParse({ username, password, email });
    if (!check.success) {
      res.status(401).send("You havenot gave the details properly");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new UserModel({
        username: username,
        password: hashedPassword,
        email: email,
      });
      await user.save();
      res.status(200).send("You are signed in");
    }
  } catch (error: any) {
    console.error("Error during signup:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user: IUser | null = await UserModel.findOne({ username });

    if (!user) {
      res.status(500).send("You are not registered");
    } else {
      const isMatch = await bcrypt.compare(password, user.password);
      const token: string = jwt.sign({ username }, JWT_SECRET, {
        expiresIn: "1h",
      });
      if (isMatch) {
        res.status(200).send({ message: "token", token });
      } else {
        res.status(401).send("Invalid password");
      }
    }
  } catch (error: any) {
    console.error("Error during signin:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server Started successfully`);
});
