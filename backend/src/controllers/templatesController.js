import ProposalTemplate from "../models/ProposalTemplate.js";
import { cloudinary, configureCloudinary } from "../config/cloudinary.js";

// @desc  Get all proposal templates
// @route GET /api/templates
export const getTemplates = async (req, res, next) => {
  try {
    const templates = await ProposalTemplate.find().sort({ createdDate: -1 });
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    next(error);
  }
};

// @desc  Upload a new template to Cloudinary and save to DB
// @route POST /api/templates
export const createTemplate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Template file (.docx) is required" });
    }

    // Ensure Cloudinary is configured with environment variables
    const cloudInstance = configureCloudinary();

    const { name, description, category } = req.body;
    const cleanName = req.file.originalname ? req.file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_") : "template.docx";
    const filename = `${Date.now()}_${cleanName}`;

    // Upload directly to Cloudinary via stream
    let result;
    try {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudInstance.uploader.upload_stream(
          {
            folder: "templates",
            resource_type: "raw",
            public_id: filename,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
    } catch (cErr) {
      console.error("CLOUDINARY UPLOAD FAILED:", {
        http_code: cErr.http_code,
        message: cErr.message,
        name: cErr.name,
        errorDetails: cErr,
      });

      return res.status(cErr.http_code || 500).json({
        success: false,
        message: `Cloudinary Upload Error (${cErr.http_code || 500}): ${cErr.message || "Failed to upload file to Cloudinary"}`,
        cloudinaryError: cErr,
      });
    }

    const template = await ProposalTemplate.create({
      name: name || req.file?.originalname?.replace(/\.[^/.]+$/, "") || "Untitled Template",
      description: description || `Uploaded template (${(req.file?.size / 1024).toFixed(1)} KB)`,
      category: category || "Custom Upload",
      format: "DOCX",
      status: "Published",
      usedCount: 0,
      fileUrl: result.secure_url || result.url,
      cloudinaryPublicId: result.public_id,
      fileSize: req.file?.size,
      createdByClerkId: req.user?.clerkId,
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error("createTemplate controller error:", error);
    next(error);
  }
};

// @desc  Delete template
// @route DELETE /api/templates/:id
export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await ProposalTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    if (template.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(template.cloudinaryPublicId, { resource_type: "raw" });
      } catch (e) {
        console.error("Cloudinary template deletion error", e);
      }
    }

    // Delete local file if stored locally
    if (template.fileUrl && template.fileUrl.startsWith("/uploads/")) {
      try {
        const localPath = path.join(process.cwd(), template.fileUrl.slice(1));
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch (e) {
        console.error("Local file deletion error", e);
      }
    }

    await template.deleteOne();
    res.status(200).json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    next(error);
  }
};
