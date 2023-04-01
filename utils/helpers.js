const util = require('util');
const { format } = util;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { Storage } = require('@google-cloud/storage');

const { gcs_project_id, gcs_bucket_name, gcs_key_file, gcs_folder_name } = require('./config');

const fileStorageGCS = new Storage({
    projectId: gcs_project_id, // Get this from Google Cloud
    keyFilename:  path.join(__dirname, "../" + gcs_key_file) // Get this from Google Cloud -> Credentials -> Service Accounts
});

const bucket = fileStorageGCS.bucket(gcs_bucket_name); // Get this from Google Cloud -> Storage  

exports.createThumbnail = async (file) => {
    const thumbnail = {
        fieldname: file.fieldname,
        originalname: `img_${file.originalname}`,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: await sharp(file.buffer).resize({ width: 500 }).toBuffer()
      }
    return thumbnail;  
}

exports.uploadImage2GCS = (file) => new Promise((resolve, reject) => {

    if( file ) {
        const { originalname, buffer } = file;
        let uploaded_file_name = path.parse(originalname).name;
        let uploaded_file_ext = path.parse(originalname).ext;
    
        const blob = bucket.file(`${gcs_folder_name}/${uploaded_file_name}_${uuidv4()}${uploaded_file_ext}`);

        const blobStream = blob.createWriteStream({
            resumable: false
        });

        blobStream.on('error', (err) => {
            console.log('failed');
            console.log(err);
            reject(`Unable to upload image, something went wrong`)
        });

        blobStream.on('finish', () => {
            const publicUrl = format(
                `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            );
            resolve(publicUrl);
        });

        blobStream.end(buffer);
    } else {
        const error = new Error('Image file not exist');
        error.statusCode = 422;
        throw error;
    }
});

exports.deleteImageFromGSC = async (fileURL) => {

    let pathStr = '/' + gcs_bucket_name + '/';
    let pos = fileURL.indexOf(pathStr);
    let fileName = fileURL.substring(pos+16);
    //console.log('fileURL:' + fileURL);
    let generationMatchPrecondition = 0;

    try {
        //console.log(bucket.file(fileName));
        const [metadata] = await bucket.file(fileName).getMetadata();
        generationMatchPrecondition = metadata.generation;
        const deleteOptions = {
            ifGenerationMatch: generationMatchPrecondition,
        };
        await bucket.file(fileName).delete(deleteOptions);
        console.log(`gs://${gcs_bucket_name}/${fileName} deleted`);
        //return true;
    } catch(err) {
        console.log(err);
        console.log('Failed to delete image file');
        //return false;
        const error = new Error('Delete image file failed');
        error.statusCode = 500;
        throw error;
    }

};