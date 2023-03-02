# Dice Game 

## Prerequisites
1. AWS acount with 
- a Lambda function
- a DynamoDB database linked to the lambda
2. Alexa skill in alexa developer account with the intents containing proper utterances and slots (refer [intents.json](https://github.com/BajajSmriti/volleyDiceGame/blob/master/intents.json) )
3. Node.js
4. TypeScript knowledge

## Prepare to run
1. Do "npm i" to install the dependencies
2. npm run deploy to deploy the code

## Workflow diagram


## Demo
Check out the demo here - [demo.mp4](https://github.com/BajajSmriti/volleyDiceGame/blob/master/demo.mp4)
It shows both the happy and sad paths. I have added session management in the dialog. The session ends in the "no" path and when the user says "bye".

## Deployment
The deployment will take a while.
![Screenshot 2023-03-01 at 11 51 58 PM](https://user-images.githubusercontent.com/38141850/222334879-b2f3c8da-4ded-447a-b527-6125b83bef0e.png)
