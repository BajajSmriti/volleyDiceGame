import * as Alexa from "ask-sdk";
import { escapeXmlCharacters } from "ask-sdk";
import { isIntent } from "./isIntent";
import { dbHandler } from "./db/dbHandler";
import { v4 as uuidv4 } from "uuid";

const CancelOrStopIntentHandler: Alexa.RequestHandler = {
  canHandle: isIntent("AMAZON.CancelIntent", "AMAZON.StopIntent"),
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Goodbye!")
      .withShouldEndSession(true)
      .getResponse();
  },
};

const HelpIntentHandler: Alexa.RequestHandler = {
  canHandle: isIntent("AMAZON.HelpIntent"),
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak("Try saying, roll the dice!")
      .withShouldEndSession(false)
      .getResponse();
  },
};

const HelloIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest" ||
      handlerInput.requestEnvelope.session.new ||
      isIntent("HelloWorldIntent")(handlerInput)
    );
  },
  handle(handlerInput) {
    // Set session attributes
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.currentScore = 0;
    sessionAttributes.userId = uuidv4();

    return handlerInput.responseBuilder
      .speak(
        "Welcome to the game! You can say 'roll the dice' to start the game or 'show me the scoreboard' to view the top 10 scores. "
      )
      .withShouldEndSession(false)
      .getResponse();
  },
};

const RollDiceIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("RollDiceIntent")(handlerInput);
  },
  handle(handlerInput) {
    const roll = Math.floor(Math.random() * 6) + 1;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let score = sessionAttributes.score || 0;
    let userName = sessionAttributes.userName || null;
    let speechOutput = "";

    if (roll === 1) {
      score = 0;

      speechOutput = "rolled a 1. Your score has been reset to zero. ";
      speechOutput = userName
        ? `${userName}, you ${speechOutput}`
        : `You ${speechOutput}`;
    } else {
      score += roll;
      speechOutput = `rolled a ${roll}. `;
      speechOutput = userName
        ? `${userName}, you ${speechOutput}`
        : `You ${speechOutput}`;
    }

    sessionAttributes.score = score;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    speechOutput +=
      "Do you want to continue or end the game? Say 'continue' to roll again or 'end game' to stop playing.";
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const ContinueGameIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("ContinueGameIntent")(handlerInput);
  },
  handle(handlerInput) {
    return RollDiceIntentHandler.handle(handlerInput);
  },
};

const EndGameIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("EndGameIntent")(handlerInput);
  },
  handle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let score = sessionAttributes.score || 0;
    let userName = sessionAttributes.userName;
    let speechOutput = userName
      ? `${userName}, your new final score is ${score}. Do you want to update your score? Say 'yes' to update or 'no' to skip.`
      : `Your final score is ${score}. Do you want to add your name to the high score list? Say 'yes, my name is [your name].' to add your name to the list or 'no' to skip.`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

const DontAddNameIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("DontAddNameIntent")(handlerInput);
  },
  handle(handlerInput) {
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.score = 0;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak("Thanks for playing, have a wonderful day!")
      .withShouldEndSession(true)
      .getResponse();
  },
};

const AddNameToHighScoreIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("AddNameToHighScoreIntent")(handlerInput);
  },
  async handle(handlerInput) {
    const { requestEnvelope, attributesManager } = handlerInput;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let score = sessionAttributes.score || 0;
    let userId = sessionAttributes.userId;
    let speechOutput;

    if (sessionAttributes.userName) {
      // Check if user is coming again and is already in the high score list
      let userDetails = await dbHandler.postUserDetails(
        userId,
        sessionAttributes.userName,
        score,
        1 // setting 1 to force update
      );
      sessionAttributes.score = 0;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
      speechOutput = `${sessionAttributes.userName}, your score of ${score} has been updated.`;
    } else {
      // Get the user name from the slots
      const userName =
        requestEnvelope.request.intent.slots.name.value ||
        sessionAttributes.userName;

      // Post request to DB
      let userDetails = await dbHandler.postUserDetails(
        userId,
        userName,
        score
      );

      if (userDetails == -1) {
        speechOutput = `${userName} username already exists. Please try another one.`;
      } else {
        sessionAttributes.userName = userName;
        sessionAttributes.score = 0;
        handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
        speechOutput = `${userName}, your score of ${score} has been added to the high score list.`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .reprompt("Want to play again? Say, roll the dice.")
      .getResponse();
  },
};

const TopTenHighScoresIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("TopTenHighScoresIntent")(handlerInput);
  },
  async handle(handlerInput) {
    const response = await dbHandler.scanDB();
    const items = response.Items || [];
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let userName = sessionAttributes.userName || null;

    // Sort items by score in descending order
    items.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Get top 10 items
    const top10Items = items.slice(0, 10);

    let speechOutput;

    if (response.Items.length == 0) {
      speechOutput = "You are the first player to test the game.";
    } else {
      // Build speech output
      speechOutput = "are the top 10 scores:";
      speechOutput = userName
        ? `${userName}, here ${speechOutput}`
        : `Here ${speechOutput}`;
      // Build high score for speech output
      for (let i = 0; i < top10Items.length; i++) {
        const item = top10Items[i];
        const usern = item.userName || "unknown user";
        const score = item.score || 0;
        speechOutput += ` Rank ${i + 1}. ${usern} with a score of ${score}.`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

function ErrorHandler(handlerInput: Alexa.HandlerInput, error: Error) {
  console.error(error.message);
  return handlerInput.responseBuilder
    .speak("Say that again?")
    .withShouldEndSession(false)
    .getResponse();
}

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    CancelOrStopIntentHandler,
    HelpIntentHandler,
    HelloIntentHandler,
    RollDiceIntentHandler,
    ContinueGameIntentHandler,
    AddNameToHighScoreIntentHandler,
    EndGameIntentHandler,
    TopTenHighScoresIntentHandler,
    DontAddNameIntentHandler
  )
  .addErrorHandler(() => true, ErrorHandler)
  .lambda();
