export const StateDefault = "default";
export const StateStudyMode = "study_mode";
export const StateTypeDefinitionToAdd = "type_definition_to_add";
export const StateTypeDefinitionToEditDefinition = "type_definition_to_edit_definition";
export const StateTypeWordToAdd = "type_word_to_add";
export const StateTypeWordToEditDefinition = "type_word_to_edit_definition";
export const StateTypeWordToFind = "type_word_to_find";
export const StateTypeWordToRemove = "type_word_to_remove";

// typeof StateCheckRandomWord | typeof StateCheckRandomDefinition |
export type State = typeof StateDefault | typeof StateTypeWordToAdd | typeof StateTypeWordToFind |
    typeof StateTypeWordToRemove | typeof StateTypeDefinitionToAdd | typeof StateTypeWordToEditDefinition |
    typeof StateTypeDefinitionToEditDefinition | typeof StateStudyMode;

export type StateInfoDefinitionToAdd = { word: string };
export type StateInfoTypeDefinitionToEditDefinition = { word: string };

export type StateInfo = {
    [StateDefault]: null,
    [StateStudyMode]: null,
    [StateTypeDefinitionToAdd]: StateInfoDefinitionToAdd,
    [StateTypeDefinitionToEditDefinition]: StateInfoTypeDefinitionToEditDefinition,
    [StateTypeWordToAdd]: null,
    [StateTypeWordToEditDefinition]: null,
    [StateTypeWordToFind]: null,
    [StateTypeWordToRemove]: null,
}

export type StateCheckFunc<T extends State, D> = (state: {
    data: D
}) => StateInfo[T]

export const StateDataCheckMap: {[key in State]: (data: any) => data is StateInfo[key]} = {
    [StateDefault]: (data: any): data is StateInfo[typeof StateDefault] => data === null,
    [StateStudyMode]: (data: any): data is StateInfo[typeof StateStudyMode] => data === null,
    [StateTypeDefinitionToAdd]: (data: any): data is StateInfo[typeof StateTypeDefinitionToAdd] => {
        if (typeof data?.word === "string") {
            return true;
        }
        return false;
    },
    [StateTypeDefinitionToEditDefinition]:
        (data: any): data is StateInfo[typeof StateTypeDefinitionToEditDefinition] => {
            if (typeof data?.word === "string") {
                return true;
            }
            return false;
        },
    [StateTypeWordToAdd]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
    [StateTypeWordToEditDefinition]: (data: any): data is StateInfo[typeof StateTypeWordToEditDefinition] =>
        data === null,
    [StateTypeWordToFind]: (data: any): data is StateInfo[typeof StateTypeWordToFind] => data === null,
    [StateTypeWordToRemove]: (data: any): data is StateInfo[typeof StateTypeWordToRemove] => data === null,
};
