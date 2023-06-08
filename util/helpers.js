const util = require('util');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Storage } = require('@google-cloud/storage');
const PDFDocument = require("pdfkit");

const { format } = util;

const Order = require("../models/order");
const { project_id, bucket_name, key_file } = require('./config');

const fileStorageGCS = new Storage({
    projectId: project_id, // Get this from Google Cloud
    keyFilename:  path.join(__dirname, "../" + key_file) // Get this from Google Cloud -> Credentials -> Service Accounts
});

const bucket = fileStorageGCS.bucket(bucket_name); // Get this from Google Cloud -> Storage  

exports.uploadImage2GCS = (file) => new Promise((resolve, reject) => {

    if( file ) {
        const { originalname, buffer } = file
        let uploaded_file_name = path.parse(originalname).name;
        let uploaded_file_ext = path.parse(originalname).ext;
        const folderName = 'shopnodejs';
    
        const blob = bucket.file(`${folderName}/${uploaded_file_name}_${uuidv4()}${uploaded_file_ext}`);
        // console.log('------');
        // console.log(blob.name);
        // console.log('------');
        //const blob = bucket.file(`${uploaded_file_name}_${uuidv4()}${uploaded_file_ext}`);
        const blobStream = blob.createWriteStream({
            resumable: false
        });

        blobStream.on('error', (err) => {
            console.log('failed');
            console.log(err);
            reject(`Unable to upload image, something went wrong`)
        });

        // blobStream.on('drain', () => {
        //     console.log('drained!');
        // });

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

    let pos = fileURL.indexOf('/n9dimagebucket/');
    let fileName = fileURL.substring(pos+16);
    // console.log('fileURL:' + fileURL);
    let generationMatchPrecondition = 0;

    try {
        console.log(bucket.file(fileName));
        const [metadata] = await bucket.file(fileName).getMetadata();
        generationMatchPrecondition = metadata.generation;
        const deleteOptions = {
            ifGenerationMatch: generationMatchPrecondition,
        };
        await bucket.file(fileName).delete(deleteOptions);
        console.log(`gs://${bucket_name}/${fileName} deleted`);
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

exports.generatePDFonGCS = async (orderID) => new Promise((resolve, reject) => {

    try {

        let folderName = 'shopnodejs';
        const invoiceName = "invoice-" + orderID + ".pdf";
        const blob = bucket.file(`${folderName}/${invoiceName}`);
        const blobStream = blob.createWriteStream({
            resumable: false
        });
    
        const doc = new PDFDocument();
        doc.pipe(blobStream);
    
        // PDF content
        doc.fontSize(26).text("Invoice", {
            underline: true,
        });
        doc.text("-------------------------");
        doc.fontSize(12).text("order#: " + orderID);
        let totalPrice = 0;
        Order.findById(orderID)
             .then(order => {
                //console.log(order);
                order.products.forEach((prod) => {
                    totalPrice += prod.quantity * prod.product.price;
                    doc.fontSize(14).text(
                        prod.product.title +
                        " - " +
                        prod.quantity +
                        " x " +
                        "$" +
                        prod.product.price
                    );
                });
                doc.text('total payment amount: $' + totalPrice);
                doc.end();        
            })
             .catch(err => {
                console.log(err);
             })

        blobStream.on('error', (err) => {
            console.log(err);
            reject(`Unable to upload PDF`)
        });

        blobStream.on('finish', () => {
            const publicUrl = format(
                `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            );
            console.log(publicUrl);
            resolve(publicUrl);
        });

        // blobStream.end();
    }catch (err) {
        console.log(err);
        const error = new Error('PDF file not uploaded');
        error.statusCode = 422;
        throw error;
    }

});

exports.createPDFGCS = () => {
    console.log("hello!");
    let fileName = 'text.txt';
    const stream = require('stream');
    const file = bucket.file(`${fileName}`);
    const passthroughStream = new stream.PassThrough();
    passthroughStream.write(contents);
    passthroughStream.end();
    const doc = new PDFDocument();
    doc.pipe(stream);
}