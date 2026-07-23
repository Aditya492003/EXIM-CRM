import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder = "documents";

        if (req.baseUrl.includes("contacts") || req.baseUrl.includes("companies")) {
            folder = "avatars";
        }

        if (req.baseUrl.includes("imports")) {
            folder = "imports";
        }

        return {
            folder,
            resource_type: "auto",
        };
    },
});


const upload = multer({
    storage,
});

export { cloudinary, upload, storage };
