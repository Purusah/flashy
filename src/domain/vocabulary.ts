import { randomInt } from "node:crypto";

import { Definition, DefinitionDefault, Err } from "../lib/types";

const UnknowsVovabularyError = new Error("upredictable error");
const EmptyVocabularyError = new Error("user vocabulary empty");
const NoCurrentWordsError = new Error("current word not set");

export class UserVocabulary {
    // private userId: number;
    private currentWord: [string, Definition] | null = null;
    private vocabulary: Array<[string, Definition]> = [];

    constructor() {
        // this.userId = userId;
        this.vocabulary = [];
    }

    nextWord(): [string, Err] {
        this.currentWord = null;
        if (this.vocabulary.length === 0) {
            return ["", EmptyVocabularyError];
        }
        const word = this.vocabulary[randomInt(0, this.vocabulary.length + 1)];
        if (word === undefined) {
            // should exist
            return ["", UnknowsVovabularyError];
        }
        this.currentWord = word;
        return [word[0], null];
    }

    nextDefinition(): [Definition, Err] {
        this.currentWord = null;
        if (this.vocabulary.length === 0) {
            return [DefinitionDefault, EmptyVocabularyError];
        }
        const word = this.vocabulary[randomInt(0, this.vocabulary.length + 1)];
        if (word === undefined) {
            // should exist
            return [DefinitionDefault, UnknowsVovabularyError];
        }
        this.currentWord = word;
        return [word[1], null];
    }

    revealCurrentWord(): [string, Err] {
        if (this.currentWord !== null) {
            return [this.currentWord[0], null];
        }
        return ["", NoCurrentWordsError];
    }

    revealCurrentDefinition(): [Definition, Err] {
        if (this.currentWord !== null) {
            return [this.currentWord[1], null];
        }
        return [DefinitionDefault, NoCurrentWordsError];
    }

    addWord(word: string, definition: Definition): void {
        this.vocabulary.push([word, definition]);
    }
}
