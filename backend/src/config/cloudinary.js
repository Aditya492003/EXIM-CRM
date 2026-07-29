import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

export const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
};

// Initial setup
configureCloudinary();

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        let folder = "documents";
        let resource_type = "auto";

        if (req.baseUrl.includes("contacts") || req.baseUrl.includes("companies")) {
            folder = "avatars";
        }

        if (req.baseUrl.includes("imports")) {
            folder = "imports";
            resource_type = "raw";
        }

        if (req.baseUrl.includes("templates")) {
            folder = "templates";
            resource_type = "raw";
        }

        const isRaw = file.originalname?.match(/\.(docx|doc|pdf|csv|xlsx|xls)$/i);
        if (isRaw || resource_type === "raw") {
            const cleanName = file.originalname ? file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_") : "file.docx";
            return {
                folder,
                resource_type: "raw",
                public_id: `${Date.now()}_${cleanName}`,
            };
        }

        return {
            folder,
            resource_type: "auto",
        };
    },
});

export { cloudinary, storage };
