import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: "db7qmdfr2",
  api_key: "723248213726281",
  api_secret: "vcFR0cRfyiGf-GqlBJ4A7mtxGKU",
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) throw new Error("No file path provided for upload");
    const response = await cloudinary.uploader.upload(localFilePath);
    console.log("File Uploaded Succesfully", response);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    console.error("Full Error:", error);
    fs.unlinkSync(localFilePath); // this will remove the failed to uploaded file from
    // server that are temporaly store in local
    return null;
  }
};
export { uploadOnCloudinary };
