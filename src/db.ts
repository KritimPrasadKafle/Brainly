import mongoose, { model, Schema, Document } from "mongoose";

// Define an interface for strong typing
interface IUser extends Document {
  username: string;
  password: string;
  email: string;
}

// Define the schema
const UserSchema = new Schema<IUser>({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
});

// Create the model
const UserModel = model<IUser>("User", UserSchema);

const ContentSchema = new Schema({
  title: { type: String, required: true },
  link: { type: String },
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User" },
});

export const ContentModel = model("Content", ContentSchema);

export default UserModel;
export { IUser };
