import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  try {
    await connectDB();

    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`⚙️ Server is running at port : ${port}`);
    });
  } catch (error) {
    console.log("MONGO db connection failed !!! ", error);
    process.exit(1);
  }
};

startServer();
