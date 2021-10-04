export type Err = Error | null;

export interface Definition {
    definition: string
    example: string[]
    synonyms: string[]
}

export const DefinitionDefault: Definition = {
    definition: "",
    example: [],
    synonyms: [],
};

export interface IDictionaryApi {
    getWord: (word: string) => Promise<[Definition[], Err]>;
}

export interface IUserStorage {
    // getUser: (userId: number) => Promise<null>; // TODO user id + state
    getState: () => Promise<string>;
    setState: (newState: string) => Promise<Err>;
    // addWord: (word: string) => Promise<Err>;
    // removeWord: (word: string) => Promise<Err>;
    // nextWord: () => Word....
}
