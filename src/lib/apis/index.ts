import fetch from "node-fetch";

import { Definition, IDictionaryApi, Err } from "../types";

export const ApiRequestErr = new Error();

interface DictionaryapiResponceDefinition {
    definition: string,
    example: string[],
    synonyms: string[],
}

const defaultDefinition = [{
    definition: "",
    example: [],
    synonyms: [],
}];

export class ApiDictionaryapi implements IDictionaryApi {
    private baseUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/"

    async getWord(word: string): Promise<[Definition[], Err]> {
        const res = await fetch(this.baseUrl + word);
        if (!res.ok) {
            return [defaultDefinition, ApiRequestErr];
        }
        const body = await res.json();
        const definitions = body[0].meanings[0].definitions.map(
            (meaning: DictionaryapiResponceDefinition) => ({
                // TODO add validation via unknown
                definitions: meaning.definition,
                example: [meaning.example],
                synonyms: meaning.synonyms.slice(0, 5)
            })
        );

        return [definitions, null];
    }
}
