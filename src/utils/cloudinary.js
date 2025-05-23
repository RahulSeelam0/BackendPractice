import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
        });

        console.log("File uploaded to Cloudinary:", response.secure_url);

        // Delete local file after upload
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.error("Upload failed:", error);
        return null;
    }
};

// Delete one or more assets by public IDs
const deleteOnCloudinary = async (arrOfPublicIds) => {
    try {
        if (!arrOfPublicIds || !Array.isArray(arrOfPublicIds) || arrOfPublicIds.length === 0) return null;

        const result = await cloudinary.api.delete_resources(arrOfPublicIds, {
            resource_type: 'image' // or 'video', 'raw', or 'auto' as needed
        });

        console.log("Deleted images on Cloudinary:", result);
        return result;
    } catch (error) {
        console.error("Delete failed:", error);
        return null;
    }
};

// Replace (delete + re-upload) an asset
const replaceOnCloudinary = async (publicIdToDelete, newLocalFilePath) => {
    try {
        if (!publicIdToDelete || !newLocalFilePath) return null;

        // Step 1: Delete existing asset
        await cloudinary.uploader.destroy(publicIdToDelete);

        // Step 2: Upload new file
        const response = await cloudinary.uploader.upload(newLocalFilePath, {
            resource_type: 'auto',
        });

        console.log("Asset replaced. New URL:", response.secure_url);

        // Clean up local file
        fs.unlinkSync(newLocalFilePath);

        return response;
    } catch (error) {
        if (fs.existsSync(newLocalFilePath)) fs.unlinkSync(newLocalFilePath);
        console.error("Replace failed:", error);
        return null;
    }
};

export {
    uploadOnCloudinary,
    deleteOnCloudinary,
    replaceOnCloudinary // renamed from updateOnCloudinary for accuracy
};
