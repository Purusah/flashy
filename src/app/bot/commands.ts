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
    CANCEL: <Commands>"Cancel",
    CHECK_DEFINITION: <Commands>"Study definition",
    CHECK_NEXT_WORD: <Commands>"Next word",
    CHECK_WORD: <Commands>"Study words",
    CHECK_WORD_DEFINITION: <Commands>"Study word or definition",
    REMOVE: <Commands>"🟥 Remove word",
    SHOW_CORRESPONDING_WORD: <Commands>"Corresponding word",
};

export const CommandState: {[Property in Commands]: Set<State>} = {
    ADD: new Set([StateDefault]),
    CANCEL: new Set([StateDefault, StateStudyMode]),
    CHECK_DEFINITION: new Set([StateDefault]),
    CHECK_NEXT_WORD: new Set([StateStudyMode]),
    CHECK_WORD: new Set([StateDefault]),
    CHECK_WORD_DEFINITION: new Set([StateDefault]),
    REMOVE: new Set([StateDefault]),
    SHOW_CORRESPONDING_WORD: new Set([StateStudyMode]),
};

export const responseCantAddWordTwice = "Can't add word twice";
export const responseGreeting = "Nice to meet you!";
export const responseGreetingAgain = "Nice to see you again!";
export const responseNothingAdded = "Nothing to show";
export const responseOkNext = "Ok, what's next?";
export const responseTypeWordToAdd = "Type word to add";
export const responseTypeWordToRemove = "Type word to remove";
export const responseTypeDefinitionToAdd = "Type definition to use";
export const responseUnknownError = "Sorry, something went wrong";
export const responseUnknownUser = "Please, type /start to use bot";
export const responseUnknownWord = "I don't know this word";
export const responseWordAdded = "Your word added";
export const responseWordRemoved = "Your word removed";
export const responseWrongCommand = "Oops, let's try again";
