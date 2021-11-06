export const StateDefault = "default";
export const StateTypeWordToAdd = "typeWordToAdd";
export const StateTypeWordToRemove = "typeWordToRemove";
export const StateTypeDefinitionToAdd = "typeDefinitionToAdd";
export const StateCheckRandomWord = "typeCheckRandomWord";
export const StateCheckRandomDefinition = "typeCheckRandomDefinition";

export type State = typeof StateDefault | typeof StateTypeWordToAdd | typeof StateTypeWordToRemove |
    typeof StateTypeDefinitionToAdd | typeof StateCheckRandomWord | typeof StateCheckRandomDefinition;

export const stateTransitionMap: {[Property in State]: Array<State>} = {
    [StateDefault]: [StateTypeWordToAdd, StateTypeWordToRemove],
    [StateTypeWordToAdd]: [StateTypeDefinitionToAdd],
    [StateTypeDefinitionToAdd]: [StateDefault],
    [StateTypeWordToRemove]: [StateDefault],
    [StateCheckRandomWord]: [StateDefault, StateCheckRandomWord],
    [StateCheckRandomDefinition]: [StateDefault, StateCheckRandomDefinition],
};

export type StateInfoDefinitionToAdd = { word: string };
export type StateCheckRandom = { ref: string };

export type StateInfo = {
    [StateDefault]: null,
    [StateTypeWordToAdd]: null,
    [StateTypeDefinitionToAdd]: StateInfoDefinitionToAdd,
    [StateTypeWordToRemove]: null,
    [StateCheckRandomWord]: StateCheckRandom,
    [StateCheckRandomDefinition]: StateCheckRandom,
}
