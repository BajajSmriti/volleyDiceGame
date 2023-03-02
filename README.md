# Dice Game 

## Prerequisites
1. AWS acount with- 
- a Lambda function
- a DynamoDB database linked to the lambda
2. Alexa skill in alexa developer account with the intents containing proper utterances and slots (refer [intents.json](https://github.com/BajajSmriti/volleyDiceGame/blob/master/intents.json) )
3. Node.js
4. TypeScript knowledge

## Prepare to run
1. Do "npm i" to install the dependencies
2. npm run deploy to deploy the code

## Requirements

- Let the user roll virtual dice.
- If the user rolls 2-6, that roll gets added to their score.
- If the user rolls a 1, the user’s score is reset to zero.
- After each roll, ask if the user wants to continue or end the game.
- After the game ends, ask if the user wants to add their name to a high score list; if yes, ask their name and add it.
- At the onset of a session, the user should be able to start a new game or listen to the top 10 high scores.

## Demo
Check out the demo here - [demo.mp4](https://github.com/BajajSmriti/volleyDiceGame/blob/master/demo.mp4)

It shows both the happy and sad paths. I have added the functionality to remember the user's name between sessions and embed it into the dialog. The session ends in the "no" path and when the user says "bye".

## Deployment
The deployment to Alexa marketplace takes around 6 days.

![Screenshot 2023-03-01 at 11 51 58 PM](https://user-images.githubusercontent.com/38141850/222334879-b2f3c8da-4ded-447a-b527-6125b83bef0e.png)
