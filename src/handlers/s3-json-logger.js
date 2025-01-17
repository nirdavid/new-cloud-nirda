// Create clients outside of the handler

// Create a client to read objects from S3
const AWS = require('aws-sdk');
//const FiboStorage = require('@fibotax/fibo-storage');
const PiDb = require('@fibotax/pi-db');
const crypto = require("crypto");
const { defActionContext, srcBucketName, dstBucketName, tableName } = require("./consts");


const s3 = new AWS.S3();

const deleteFileFromBucket = async (params) => {
    await s3.deleteObject(params).promise();
    console.log('File deleted successfully');
}

const saveFileInNewBucket = async (destparams) => {
    console.log('Dest bucket: ' + destparams.Bucket);
    console.log('Dest Key: ' + destparams.Key);
    await s3.putObject(destparams).promise();
    console.log('File uploaded successfully!');
}

const saveFileInDB = async (oldFileName, newFileName) => {
    console.log('Old file name: ' + oldFileName + ' / New file name: ' + newFileName);
    const db = new PiDb('http://postgrest-dev.local:3000');
    console.log('Created pi-db');
    console.log('Table name: ' + tableName);
    const createResult = await db.create(tableName, defActionContext, {file_old_name: oldFileName, file_new_name: newFileName});
    console.log(createResult);
}

/**
  * A Lambda function that checks the payload received from S3, and rename it if it's a pdf.
  */
exports.pdfHandler = async (event, context) => {
    const getObjectRequests = event.Records.map(async (record) => {
        const params = {
            Bucket: record.s3.bucket.name,
            Key: record.s3.object.key,
        };
        try {
            const {ContentType, Body} = await s3.getObject(params).promise();
            console.log('ContentType: ' + ContentType);
            console.log('Bucket: ' + params.Bucket);
            console.log('Key: ' + params.Key);
            let isFilePDF = false;
            if (ContentType) {
                isFilePDF = ContentType.split("/")[1] === 'pdf';
            }
            if (!isFilePDF) {
                await deleteFileFromBucket(params);
            } else {
                const newFileName = crypto.randomBytes(16).toString("hex")+'.pdf';
                const destparams = {
                    Bucket: params.Bucket.replace(srcBucketName, dstBucketName),
                    Key: newFileName,
                    Body: Body,
                    ContentType: ContentType
                };
                await saveFileInNewBucket(destparams);
                await saveFileInDB(params.Key, newFileName);   
            }
            console.log('Goodbye');
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    await Promise.all(getObjectRequests);
};