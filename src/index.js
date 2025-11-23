import dotenv from "dotenv";
import express from "express";
dotenv.config({ path: "./.env" });
const app = express();
import { connectionDB } from "./database/db.js";
connectionDB();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       //check if the express talk to database or not
//       console.log("Express Error:" + error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is connected on port: ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("ERROR" + error);
//     throw error;
//   }
// })();
