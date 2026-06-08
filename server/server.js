import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { initNodeMetadata } from "./services/loadBalancerService.js";

dotenv.config({
  path: "./.env",
});

const startServer = async () => {
  try {
    await connectDB();

    await initNodeMetadata();

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
