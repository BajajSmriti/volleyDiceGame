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
      .speak("Try saying hello!")
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

    return (
      handlerInput.responseBuilder
        .speak(
          "Welcome to my skill! You can say 'roll the dice' to start the game or 'show me the scoreboard' to view the top 10 scores. "
        )
        // .reprompt("You can say 'roll the dice' to start the game.")
        .withShouldEndSession(false)
        .getResponse()
    );
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
    let speechOutput = "";

    if (roll === 1) {
      score = 0;
      speechOutput = "You rolled a 1. Your score has been reset to zero. ";
    } else {
      score += roll;
      speechOutput = `You rolled a ${roll}. `;
    }

    sessionAttributes.score = score;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    speechOutput +=
      "Do you want to continue or end the game? Say 'continue' to roll again or 'end game' to stop playing.";
    return (
      handlerInput.responseBuilder
        .speak(speechOutput)
        // .reprompt("Say 'continue' to roll again or 'end game' to stop playing.")
        .withShouldEndSession(false)
        .getResponse()
    );
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

    let speechOutput = `Your final score is ${score}. Do you want to add your name to the high score list? Say 'yes, my name is [your name].' to add your name to the list or 'no' to skip.`;

    return (
      handlerInput.responseBuilder
        .speak(speechOutput)
        // .reprompt("Say 'yes' to add your name to the list or 'no' to skip.")
        .withShouldEndSession(false)
        .getResponse()
    );
  },
};

const DontAddNameIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return isIntent("DontAddNameIntent")(handlerInput);
  },
  handle(handlerInput) {
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

    // Get the user name from the slots
    const userName = requestEnvelope.request.intent.slots.name.value;
    await dbHandler.postUserDetails(userId, userName, score);
    let speechOutput = `Your score of ${score} has been added to the high score list. Goodbye!`;

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
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

    // Sort items by score in descending order
    items.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Get top 10 items
    const top10Items = items.slice(0, 10);

    let speechOutput;

    if (response.Items.length == 0) {
      speechOutput = "You are the first player to test the game.";
    } else {
      // Build speech output
      speechOutput = "Here are the top 10 scores:";
      for (let i = 0; i < top10Items.length; i++) {
        const item = top10Items[i];
        const username = item.userName || "unknown user";
        const score = item.score || 0;
        speechOutput += ` ${i + 1}. ${username} with a score of ${score}.`;
      }
    }

    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(false)
      .getResponse();
  },
};

function ErrorHandler(handlerInput: Alexa.HandlerInput, error: Error) {
  return handlerInput.responseBuilder
    .speak(
      ` <amazon:emotion name="excited" intensity="high">
          Abort mission, repeating, abort mission!
        </amazon:emotion>
        <sub alias=",">${escapeXmlCharacters(error.message)}</sub>`
    )
    .withShouldEndSession(true)
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
