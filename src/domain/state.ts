export const StateDefault = "default";
export const StateTypeWordToAdd = "type_word_to_add";
export const StateTypeWordToRemove = "type_word_to_remove";
export const StateTypeDefinitionToAdd = "type_definition_to_add";
// export const StateCheckRandomWord = "checkRandomWord";
// export const StateCheckRandomDefinition = "checkRandomDefinition";
export const StateStudyMode = "study_mode";

// typeof StateCheckRandomWord | typeof StateCheckRandomDefinition |
export type State = typeof StateDefault | typeof StateTypeWordToAdd | typeof StateTypeWordToRemove |
    typeof StateTypeDefinitionToAdd | typeof StateStudyMode;

export type StateInfoDefinitionToAdd = { word: string };

export type StateInfo = {
    [StateDefault]: null,
    [StateTypeWordToAdd]: null,
    [StateTypeDefinitionToAdd]: StateInfoDefinitionToAdd,
    [StateTypeWordToRemove]: null,
    // [StateCheckRandomWord]: StateCheckRandom,
    // [StateCheckRandomDefinition]: StateCheckRandom,
    [StateStudyMode]: null,
}

export type StateCheckFunc<T extends State, D> = (state: {
    data: D
}) => StateInfo[T]

export const StateDataCheckMap: {[key in State]: (data: any) => data is StateInfo[key]} = {
    [StateDefault]: (data: any): data is StateInfo[typeof StateDefault] => data === null,
    [StateTypeWordToAdd]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
    [StateTypeDefinitionToAdd]: (data: any): data is StateInfo[typeof StateTypeDefinitionToAdd] => {
        if (typeof data?.word === "string") {
            return true;
        }
        return false;
    },
    [StateTypeWordToRemove]: (data: any): data is StateInfo[typeof StateTypeWordToRemove] => data === null,
    [StateStudyMode]: (data: any): data is StateInfo[typeof StateDefault] => data === null,
};
