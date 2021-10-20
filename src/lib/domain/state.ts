export const StateDefault = "default";
export const StateTypeWordToAdd = "typeWordToAdd";
export const StateTypeWordToRemove = "typeWordToRemove";
export const StateTypeDefinitionToAdd = "typeDefinitionToAdd";

export type State = typeof StateDefault | typeof StateTypeWordToAdd | typeof StateTypeWordToRemove |
    typeof StateTypeDefinitionToAdd;

export const stateTransitionMap: {[Property in State]: Array<State>} = {
    [StateDefault]: [StateTypeWordToAdd, StateTypeWordToRemove],
    [StateTypeWordToAdd]: [StateTypeDefinitionToAdd],
    [StateTypeDefinitionToAdd]: [StateDefault],
    [StateTypeWordToRemove]: [StateDefault],
};

export type StateInfoDefinitionToAdd = { word: string };

export type StateInfo = {
    [StateDefault]: null,
    [StateTypeWordToAdd]: null,
    [StateTypeDefinitionToAdd]: StateInfoDefinitionToAdd,
    [StateTypeWordToRemove]: null,
}
