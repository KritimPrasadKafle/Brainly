import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import z from "zod";
import bcrypt from "bcrypt";
import UserModel, { ContentModel, IUser } from "./db";
import dotenv from "dotenv";
import { userMiddleware } from "./middleware";

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
      const token: string = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "1h",
      });
      if (isMatch) {
        res.status(200).send({ token: token });
      } else {
        res.status(401).send("Invalid password");
      }
    }
  } catch (error: any) {
    console.error("Error during signin:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { link, title } = req.body;

    if (!link || !title) {
      res.status(400).json({
        message: "Link and title are required to create content",
      });
    }

    const content = new ContentModel({
      link,
      title,
      //@ts-ignore
      userId: req.userId,
      tags: [],
    });

    await content.save();

    // Send successful response
    res.status(201).json({
      message: "Content added successfully",
      content: {
        link: content.link,
        title: content.title,
        userId: content.userId,
        tags: content.tags,
      },
    });
  } catch (error: any) {
    // Handle unexpected errors
    console.error("Error during content creation:", error.message);
    res.status(500).send({
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server Started successfully`);
});
