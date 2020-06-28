const srcBucketName = 'simpleappbucket';
const dstBucketName = 'destbucket';
const defActionContext = {
    client_id: 'NIR_PILEUS',
    client_display_name: 'nirPileus',
}
const tableName = 'cloud-exercise-table';

module.exports = { srcBucketName, dstBucketName, defActionContext, tableName };
