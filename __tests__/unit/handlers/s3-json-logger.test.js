// Import mock AWS SDK from aws-sdk-mock
const AWS = require('aws-sdk-mock');

describe('Test for nirda-cloud-exercise', () => {

    console.log = jest.fn();

    const objectBody = 'DATA';
    let getObjectResponse = { Body: objectBody, ContentType: 'application/pdf' };
    
    it('Verifies the object is read and the payload is uploaded', async () => {
        AWS.mock('S3', 'getObject', (params, callback) => {
            callback(null, getObjectResponse);
        });
        AWS.mock('S3', 'putObject', (params, callback) => {
            callback(null, {});
        });
        AWS.mock('S3', 'deleteObject', (params, callback) => {
            callback(null, {});
        });
        jest.mock('@fibotax/pi-db', () => {
            return jest.fn().mockImplementation(() => {
                return {create: jest.fn()};
            });
        });

        // Import all functions from s3-json-logger.js. The imported module uses the mock AWS SDK
        const s3JsonLogger = require('../../../src/handlers/s3-json-logger.js');

        const event = {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: 'test-bucket',
                        },
                        object: {
                            key: 'dummy.pdf',
                        }
                    },
                },
            ],
        };

       
        await s3JsonLogger.pdfHandler(event, null);

        // Verify that console.log has been called with the expected payload
        expect(console.log).toHaveBeenCalledWith('File uploaded successfully!');
        expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/Old file name: dummy.pdf(.*?)/)); //can't expect the uid, so use regex
        expect(console.log).toHaveBeenCalledWith('Created pi-db');
        expect(console.log).toHaveBeenCalledWith('Goodbye');

        //AWS.restore('S3');

    });

    it('Verifies the object is read and the payload is deleted', async () => {
        
        getObjectResponse.ContentType = 'application/json';

        // Import all functions from s3-json-logger.js. The imported module uses the mock AWS SDK
        const s3JsonLogger = require('../../../src/handlers/s3-json-logger.js');

        const event = {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: 'test-bucket',
                        },
                        object: {
                            key: 'dummy.json',
                        }
                    },
                },
            ],
        };

        await s3JsonLogger.pdfHandler(event, null);
        expect(console.log).toHaveBeenCalledWith('File deleted successfully');
        expect(console.log).toHaveBeenCalledWith('Goodbye');

        AWS.restore('S3');
    });
});
