import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "doewibrbk",
  api_key: "941168131184818",
  api_secret: "BVYpiZvPAmfJGbR_XAglf7DUFRA",
});

const opts = {
  overwrite: true,
  invalidate: true,
  resource_type: "auto",
  folder: "profile_photos",
};

const uploadImage = (image) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(image, opts, (error, result) => {
      if (result && result.secure_url) {
        return resolve(result.secure_url);
      }
      return reject({ message: error.message });
    });
  });
};

export default uploadImage;
