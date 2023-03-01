import { DynamoDB } from "aws-sdk";
import { Constants } from "../constants";

const dynamoDB = new DynamoDB.DocumentClient();

async function postUserDetails(userId, userName, score) {
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

async function scanDB() {
  // Fetch the top 10 user's score and name from the high score list.
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
