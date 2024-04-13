import mongoose from 'mongoose';
import colors from 'colors';
import dotenv from 'dotenv';
dotenv.config();

const DBConfig = mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log(
      `MongoDB connected to database on ${mongoose.connection.host}`.blue
    );
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });

export default DBConfig;
