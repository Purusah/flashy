import {
    State,
    StateDefault,
    StateStudyMode,
    StateTypeDefinitionToAdd,
    StateTypeDefinitionToEditDefinition,
    StateTypeWordToAdd,
    StateTypeWordToEditDefinition,
    StateTypeWordToFind,
    StateTypeWordToRemove,
} from "../../../domain/state";

export type Commands = "ADD" |
    "REMOVE" |
    "CHECK_WORD" |
    "CHECK_DEFINITION" |
    "CHECK_WORD_DEFINITION" |
    "CANCEL" |
    "CHECK_NEXT_WORD" |
    "EDIT_DEFINITION" |
    "GET_WORD" |
    "LIST_WORDS";

export const onTextMsgAllowedState: Set<State> = new Set([
    StateTypeDefinitionToAdd,
    StateTypeDefinitionToEditDefinition,
    StateTypeWordToEditDefinition,
    StateTypeWordToAdd,
    StateTypeWordToFind,
    StateTypeWordToRemove,
]);

export const Command: { [Property in Commands]: string } = {
    ADD: <Commands>"🟢 Add word",
    CANCEL: <Commands>"Cancel",
    CHECK_DEFINITION: <Commands>"Study definition",
    CHECK_NEXT_WORD: <Commands>"Next word",
    CHECK_WORD: <Commands>"🧑‍🎓 Study words",
    CHECK_WORD_DEFINITION: <Commands>"Study word or definition",
    EDIT_DEFINITION: "Edit word",
    GET_WORD: "🔍 Find word",
    LIST_WORDS: "📓 List words",
    REMOVE: <Commands>"🟥 Remove word",
};

const baseAllowedStates: Set<State> = new Set([
    StateDefault, StateTypeWordToEditDefinition, StateTypeWordToAdd, StateTypeWordToFind, StateTypeWordToRemove,
]);

export const CommandState: { [Property in Commands]: Set<State> } = {
    ADD: baseAllowedStates,
    CANCEL: new Set([StateDefault, StateStudyMode]),
    CHECK_DEFINITION: new Set([StateDefault, StateStudyMode]),
    CHECK_NEXT_WORD: new Set([StateDefault, StateStudyMode]),
    CHECK_WORD: new Set([StateDefault, StateStudyMode]),
    CHECK_WORD_DEFINITION: new Set([StateDefault, StateStudyMode]),
    EDIT_DEFINITION: baseAllowedStates,
    GET_WORD: baseAllowedStates,
    LIST_WORDS: new Set([StateDefault]),
    REMOVE: baseAllowedStates,
};

export const Responses = {
    BAD_COMMAND: "Oops, let's try again",
    BAD_WORD: "Oops, word not found",
    DEFINITION_ADD_TYPE: "Type definition to use",
    DEFINITION_EDIT_TYPE_DEFINITION: "Type new definition",
    DEFINITION_EDIT_TYPE_WORD: "Type word to edit definition",
    GREET: "Nice to meet you!",
    GREET_REPEAT: "Nice to see you again!",
    NOT_FOUND: "Nothing to show",
    OK_NEXT: "Ok, what's next?",
    ERROR: "Oops, something went wrong",
    WORD_ADD_OK: "Your word added",
    WORD_ADD_TYPE: "Type word to add",
    WORD_FIND_TYPE: "Type word to find",
    WORD_REMOVE_OK: "Your word removed",
    WORD_REMOVE_TYPE: "Type word to remove",

};
