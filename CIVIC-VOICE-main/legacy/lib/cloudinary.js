import { v2 as cloudinary } from "cloudinary";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary environment variables are not fully set.");
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer, filename = "upload.jpg") {
  const ext = filename.split(".").pop() || "jpg";
  const dataUri = `data:image/${ext};base64,${buffer.toString("base64")}`;

  const res = await cloudinary.uploader.upload(dataUri, {
    folder: "civicvoice/issues",
  });

  return res.secure_url;
}
