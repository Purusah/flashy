// export const stateDefaultName = "default";
// export const stateTypeWordToAddName = "typeWordToAdd";
// export const stateTypeWordToRemoveName = "typeWordToRemove";
// export const stateTypeDefinitionToAddName = "typeDefinitionToAdd";

export const stateDefault = "default"; // Symbol(stateDefaultName);
export const stateTypeWordToAdd = "typeWordToAdd"; // Symbol(stateTypeWordToAddName);
export const stateTypeWordToRemove = "typeWordToRemove"; // Symbol(stateTypeWordToRemoveName);
export const stateTypeDefinitionToAdd = "typeDefinitionToAdd"; // Symbol(stateTypeDefinitionToAddName);

export type State = typeof stateDefault | typeof stateTypeWordToAdd | typeof stateTypeWordToRemove | typeof stateTypeDefinitionToAdd;

export const stateTransitionMap: {[Property in State]: Array<State>} = {
    [stateDefault]: [stateTypeWordToAdd, stateTypeWordToRemove],
    [stateTypeWordToAdd]: [stateTypeDefinitionToAdd],
    [stateTypeDefinitionToAdd]: [stateDefault],
    [stateTypeWordToRemove]: [stateDefault],
};

// export type stateDefaultInfo = {
//     type: typeof stateDefaultName
// }
