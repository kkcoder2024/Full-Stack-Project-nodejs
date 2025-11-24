import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectionDB = async () => {
  try {
    const connection_response = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `Database connected!! DB Host: ${connection_response.connection.host}`
    );
  } catch (error) {
    console.log(`Database connection failed!: ${error}`);
    process.exit(1);
  }
};

export { connectionDB };
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
