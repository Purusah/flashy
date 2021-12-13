import {
    State,
    StateDefault,
    StateStudyMode,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
} from "../../domain/state";

export type Commands = "ADD" |
 "REMOVE" |
 "CHECK_WORD" |
 "CHECK_DEFINITION" |
 "CHECK_WORD_DEFINITION" |
 "CANCEL" |
 "SHOW_CORRESPONDING_WORD" |
 "CHECK_NEXT_WORD";

export const onTextMsgAllowedState: Set<State> = new Set(
    [StateTypeWordToAdd, StateTypeDefinitionToAdd, StateTypeWordToRemove],
);

export const Command: {[Property in Commands]: string} = {
    ADD: <Commands>"🟢 Add word",
    REMOVE: <Commands>"🟥 Remove word",
    CHECK_WORD: <Commands>"Study words",
    CHECK_DEFINITION: <Commands>"Study definition",
    CHECK_WORD_DEFINITION: <Commands>"Study word or definition",
    CANCEL: <Commands>"Cancel",
    SHOW_CORRESPONDING_WORD: <Commands>"Corresponding word",
    CHECK_NEXT_WORD: <Commands>"Next word",
};

export const CommandState: {[Property in Commands]: Set<State>} = {
    ADD: new Set([StateDefault]),
    REMOVE: new Set([StateDefault]),
    CHECK_WORD: new Set([StateDefault]),
    CHECK_DEFINITION: new Set([StateDefault]),
    CHECK_WORD_DEFINITION: new Set([StateDefault]),
    CANCEL: new Set([StateDefault, StateStudyMode]),
    SHOW_CORRESPONDING_WORD: new Set([StateStudyMode]),
    CHECK_NEXT_WORD: new Set([StateStudyMode]),
};

export const responseWrongCommand = "Oops, let's try again";
export const responseUnknownUser = "Please, type /start to use bot";
export const responseWordRemoved = "Your word removed";
export const responseGreeting = "Nice to meet you!";
export const responseGreetingAgain = "Nice to see you again!";
export const responseWordAdded = "Your word added";
export const responseCantAddWordTwice = "Can't add word twice";
export const responseTypeWordToAdd = "Type word to add";
export const responseTypeWordToRemove = "Type word to remove";
export const responseTypeDefinitionToAdd = "Type definition to use";
export const responseNothingAdded = "Nothing to show";
export const responseUnknownError = "Sorry, something went wrong";
export const responseUnknownWord = "I don't know this word";
export const responseOkNext = "Ok, what's next?";
