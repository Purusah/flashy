export type Commands = "ADD" | "REMOVE" | "CHECK_WORD" | "CHECK_DEFINITION" | "CHECK_WORD_DEFINITION";
export type CommandRepository = {[Property in Commands]: string};

export const Command: CommandRepository = {
    ADD: <Commands>"🟢 Add word",
    REMOVE: <Commands>"🟥 Remove word",
    CHECK_WORD: <Commands>"Study words",
    CHECK_DEFINITION: <Commands>"Study defintion",
    CHECK_WORD_DEFINITION: <Commands>"Study word or defintion",
};

export const responseWrongCommand = "Sorry, I don't understand you, please, try again";
export const responseInternalErrorOnStart = "Sorry, I can't start for now. Please, try again later";
export const responseUnknownUser = "Please, type /start to use bot";
export const responseGreeting = "Nice to meet you!";
export const responseGreetingAgain = "Nice to see you again!";
export const responseTypeWordToAdd = "Type word to add";
export const responseTypeWordToRemove = "Type word to remove";
export const responseTypeDefinitionToAdd = "Type definition to use";
export const responseUnknownError = "Sorry, something went wrong";
