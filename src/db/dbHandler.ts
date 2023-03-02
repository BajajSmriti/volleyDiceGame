import { DynamoDB } from "aws-sdk";
import { Constants } from "../constants";

const dynamoDB = new DynamoDB.DocumentClient();

async function postUserDetails(userId, userName, score, flag = 0) {
  if (!flag) {
    // Check username exists only if flag = 0
    let res = await getUserDetails(userName);
    if (res.Items[0] && res.Items[0].userName === userName) {
      return -1;
    }
  }
  // Save the user's score and name to the high score list.
  try {
    const result = await dynamoDB
      .put({
        TableName: Constants.dbname,
        Item: {
          userId,
          userName,
          score,
        },
      })
      .promise();

    return result;
  } catch (err) {
    throw err;
  }
}

async function getUserDetails(userName) {
  // Save the user's score and name to the high score list.
  try {
    const result = await dynamoDB
      .scan({
        TableName: Constants.dbname,
        FilterExpression: "userName = :userName",
        ExpressionAttributeValues: {
          ":userName": userName,
        },
      })
      .promise();

    return result;
  } catch (err) {
    throw err;
  }
}

async function scanDB() {
  // Full DB Scan
  try {
    const params = {
      TableName: Constants.dbname,
    };

    const response = await dynamoDB.scan(params).promise();
    return response;
  } catch (err) {
    throw err;
  }
}

export const dbHandler = {
  postUserDetails,
  scanDB,
};
