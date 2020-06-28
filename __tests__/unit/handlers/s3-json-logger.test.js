// Import mock AWS SDK from aws-sdk-mock
const AWS = require('aws-sdk-mock');

describe('Test for s3-json-logger', () => {
    // This test invokes the s3-json-logger Lambda function and verifies that the received payload is logged
    it('Verifies the object is read and the payload is logged', async () => {
        const objectBody = 'DATA';
        const getObjectResponse = { Body: objectBody, ContentType: 'application/pdf' };
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


        // Mock console.log statements so we can verify them. For more information, see
        // https://jestjs.io/docs/en/mock-functions.html
        console.log = jest.fn();

        // Create a sample payload with S3 message format
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

        // Import all functions from s3-json-logger.js. The imported module uses the mock AWS SDK
        const s3JsonLogger = require('../../../src/handlers/s3-json-logger.js');
        await s3JsonLogger.pdfHandler(event, null);

        // Verify that console.log has been called with the expected payload
        expect(console.log).toHaveBeenCalledWith('File uploaded successfully!');
        expect(console.log).toHaveBeenCalledWith('dummy.pdf');
        expect(console.log).toHaveBeenCalledWith('created pi-db');

        AWS.restore('S3');
    });
});
