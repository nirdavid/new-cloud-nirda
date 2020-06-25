// Create clients outside of the handler

// Create a client to read objects from S3
const AWS = require('aws-sdk');
const FiboStorage = require('@fibotax/fibo-storage');
const PiDb = require('@fibotax/pi-db');
const crypto = require("crypto");


const s3 = new AWS.S3();

const defActionContext = {
    client_id: 'NIR_PILEUS',
    client_display_name: 'nirPileus',
}

const deleteFileFromBucket = async (params) => {
    await s3.deleteObject(params).promise();
    console.log('File deleted successfully');
}

const saveFileInNewBucket = async (srcBucketName) => {
    const newFileName = crypto.randomBytes(16).toString("hex")+'.pdf';
    const destparams = {
        Bucket: srcBucketName.replace("simpleappbucket", "destbucket"),
        Key: newFileName,
        Body: Body,
        ContentType: ContentType
    };
    console.log('Dest bucket: ' + destparams.Bucket);
    console.log('Dest Key: ' + destparams.Key);
    const putResult = await s3.putObject(destparams).promise();
    console.log('File uploaded successfully!: ' + putResult.Body);
    return newFileName;
}

const saveFileInDB = async (oldFileName, newFileName) => {
    console.log(oldFileName + ' / ' + newFileName);
    const db = new PiDb('pi-db-dev.cjuu324bnddy.us-east-1.rds.amazonaws.com');
    console.log('created pi-db');
    const createResult = await db.create('cloud_exercise_table', defActionContext, {file_old_name: oldFileName, file_new_name: newFileName});
    console.log(createResult);
}

/**
  * A Lambda function that checks the payload received from S3, and rename it if it's pdf.
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
                const newFileName = await saveFileInNewBucket(params.Bucket);
                console.log('hi');
                await saveFileInDB(params.Key, newFileName);
                
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    });

    await Promise.all(getObjectRequests);
};