import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URL);
    console.log(
      `✅ Database Connected Successfully. ${connect.connection.host}`,
    );
  } catch (error) {
    console.log(`❌ Error connecting to mongoDB: ${error.message}`);
    process.exit(1); // 0 means success and 1 means exit will failure
  }
};

export default connectDB;
