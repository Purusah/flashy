export const StateDefault = "default";
export const StateTypeWordToAdd = "typeWordToAdd";
export const StateTypeWordToRemove = "typeWordToRemove";
export const StateTypeDefinitionToAdd = "typeDefinitionToAdd";
export const StateCheckRandomWord = "checkRandomWord";
export const StateCheckRandomDefinition = "checkRandomDefinition";

export type State = typeof StateDefault | typeof StateTypeWordToAdd | typeof StateTypeWordToRemove |
    typeof StateTypeDefinitionToAdd | typeof StateCheckRandomWord | typeof StateCheckRandomDefinition;

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

export type StateCheckFunc<T extends State, D> = (state: {
    data: D
}) => StateInfo[T]

export const StateDataCheckMap = {
    [StateDefault]: (data: any): data is StateInfo[typeof StateDefault] => data === null,
    [StateTypeWordToAdd]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
    [StateTypeDefinitionToAdd]: (data: any): data is StateInfoDefinitionToAdd => {
        if (typeof data?.word === "string") {
            return true;
        }
        return false;
    },
    [StateTypeWordToRemove]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
    [StateCheckRandomWord]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
    [StateCheckRandomDefinition]: (data: any): data is StateInfo[typeof StateTypeWordToAdd] => data === null,
};
