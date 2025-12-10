import { v2 as cloudinary } from "cloudinary";
import fs, { existsSync, unlinkSync } from "fs";
import { ApiErrorHandle } from "./ApiErrorHandle";
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
    new ApiErrorHandle(500, "Cloudinary Upload Error:", error.message);
    fs.unlinkSync(localFilePath); // this will remove the failed to uploaded file from
    // server that are temporaly store in local
    return null;
  }
};

const updateImageOnCloudinary = async (OldImageUrl, newImageURL) => {
  try {
    if (!newImageURL || !OldImageUrl) {
      new ApiErrorHandle(500, "Image path not found.");
    }

    const publicId = OldImageUrl.split("/").pop().split(".")[0];
    const uploadImage = await cloudinary.uploader.upload(newImageURL, {
      public_id: publicId,
      overwrite: true,
      invalidate: true,
    });

    if (existsSync(newImageURL)) {
      unlinkSync(newImageURL);
    }

    return uploadImage.url;
  } catch (error) {
    new ApiErrorHandle(500, "Cloudinary Upload Error:", error.message);
  }
};
export { uploadOnCloudinary, updateImageOnCloudinary };
