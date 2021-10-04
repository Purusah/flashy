import { Definition, Err } from "../types";

interface WordData {
    word: string
    definitions: Definition[]
}

interface ApiReader {
    getWord: (word: string) => Promise<[Definition[], Err]>
}

export class Dictionary {
    private _api: ApiReader;
    private _data: {[word: string]: WordData};

    constructor(api: ApiReader) {
        this._api = api;
        this._data = {};
    }

    async getDefinitions(word: string): Promise<Definition[]> {
        const cacheDefinition = this._data[word];
        if (cacheDefinition !== undefined) {
            return cacheDefinition.definitions;
        }

        const [definitions, err] = await this._api.getWord(word);
        if (err !== null) {
            return [];
        }
        this._data[word] = { word, definitions };
        return definitions;
    }
}
