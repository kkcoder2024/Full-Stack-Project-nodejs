import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import { app } from "./app.js";
import { connectionDB } from "./database/db.js";
// this async function return a Promise so that we can work with it and handle it properly
connectionDB()
  .then(() => {
    app.on("error", (error) => {
      //check if the express talk to database or not
      console.log("Express Error:" + error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Database failed to connect!! ${err}`);
  });
