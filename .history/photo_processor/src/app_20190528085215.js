// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        // const ret = await axios(url);
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
                // location: ret.data.trim()
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

const DynamoDBDocClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const uuidv4 = require('uuid/v4');


const DYNAMODB_PHOTOS_TABLE_NAME = process.env.DYNAMODB_PHOTOS_TABLE_ARN.split('/')[1];

function storePhotoInfo(item) {
  const params = {
    Item: item,
    TableName: DYNAMODB_PHOTOS_TABLE_NAME
  };
  return DynamoDBDocClient.put(params).promise();
}

async function getMetadata(bucketName, key) {
  const headResult = await S3.headObject({Bucket: bucketName, Key: key }).promise();
  return headResult.Metadata;
}

async function processRecord(record) {
  const bucketName = record.s3.bucket.name;
  const key = record.s3.object.key;
    
  if (key.indexOf('uploads') != 0) return;
    
  const metadata = await getMetadata(bucketName, key);
  const sizes = await resize(bucketName, key);    
  const id = uuidv4();
  const item = {
    id: id,
    owner: metadata.owner,
    photoAlbumId: metadata.albumid,
    bucket: bucketName,
    thumbnail: sizes.thumbnail,
    fullsize: sizes.fullsize,
    createdAt: new Date().getTime()
  }
  await storePhotoInfo(item);
}