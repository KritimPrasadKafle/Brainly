import { model, Schema, Document } from "mongoose";

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

export default UserModel;
export { IUser };
