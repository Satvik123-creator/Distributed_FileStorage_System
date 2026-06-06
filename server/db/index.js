import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI?.replace(/\/+$/, "");

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not configured");
    }

    const connectionInstance = await mongoose.connect(mongoUri, {
      dbName: DB_NAME,
    });
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
