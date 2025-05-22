import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


    // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) =>{
    try{
        if(!localFilePath) return null;

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto",
        })
        //file has been uploaded succesfully
        console.log("File is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath) // remove the loaclly saved temporary file as the upload operation got failed
        return null;
    }
}

const deleteOnCloudinary = async (arrOfPublicIds) =>{
    try{
        if(arrOfPublicIds) return null;
        await cloudinary.api.delete_resources(arrOfPublicIds,{
            type : "auto",
        }).then(result=>console.log(result, "Deleted image on cloudinary as entry not created succefully"));

    }catch(error){
        console.log(error);
        return null;
    }
}

export { uploadOnCloudinary }
export { deleteOnCloudinary }

