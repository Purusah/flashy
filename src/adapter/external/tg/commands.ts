import {
    State,
    StateDefault,
    StateStudyMode,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
} from "../../../domain/state";

export type Commands = "ADD" |
    "REMOVE" |
    "CHECK_WORD" |
    "CHECK_DEFINITION" |
    "CHECK_WORD_DEFINITION" |
    "CANCEL" |
    "CHECK_NEXT_WORD" |
    "LIST_WORDS";

export const onTextMsgAllowedState: Set<State> = new Set(
    [StateTypeWordToAdd, StateTypeDefinitionToAdd, StateTypeWordToRemove],
);

export const Command: { [Property in Commands]: string } = {
    ADD: <Commands>"🟢 Add word",
    CANCEL: <Commands>"Cancel",
    CHECK_DEFINITION: <Commands>"Study definition",
    CHECK_NEXT_WORD: <Commands>"Next word",
    CHECK_WORD: <Commands>"Study words",
    CHECK_WORD_DEFINITION: <Commands>"Study word or definition",
    LIST_WORDS: "📓 List words",
    REMOVE: <Commands>"🟥 Remove word",
};

export const CommandState: { [Property in Commands]: Set<State> } = {
    ADD: new Set([StateDefault]),
    CANCEL: new Set([StateDefault, StateStudyMode]),
    CHECK_DEFINITION: new Set([StateDefault, StateStudyMode]),
    CHECK_NEXT_WORD: new Set([StateDefault, StateStudyMode]),
    CHECK_WORD: new Set([StateDefault, StateStudyMode]),
    CHECK_WORD_DEFINITION: new Set([StateDefault, StateStudyMode]),
    LIST_WORDS: new Set([StateDefault]),
    REMOVE: new Set([StateDefault]),
};

export const Responses = {
    BAD_COMMAND: "Oops, let's try again",
    BAD_WORD: "Oops, word not found",
    DEFINITION_ADD_TYPE: "Type definition to use",
    GREET: "Nice to meet you!",
    GREET_REPEAT: "Nice to see you again!",
    NOT_FOUND: "Nothing to show",
    OK_NEXT: "Ok, what's next?",
    ERROR: "Oops, something went wrong",
    WORD_ADD_OK: "Your word added",
    WORD_ADD_TYPE: "Type word to add",
    WORD_REMOVE_OK: "Your word removed",
    WORD_REMOVE_TYPE: "Type word to remove",

};
