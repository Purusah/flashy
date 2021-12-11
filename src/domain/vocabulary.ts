import { randomInt } from "node:crypto";

import { ERROR_CODES, getStorage, isDatabaseError } from "../lib/storage";
import { Definition, DefinitionDefault, Err } from "../lib/types";

const UnknownVocabularyError = new Error("unpredictable error");
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
            return ["", UnknownVocabularyError];
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
            return [DefinitionDefault, UnknownVocabularyError];
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

export interface LearningPair {
    word: string;
    definition: string;
}

export const createLearningPair = async (
    updateData: {userId: number, word: string, definition: string}
): Promise<void> => {
    const {userId, word, definition} = updateData;

    try {
        await getStorage().query(
            "INSERT INTO definitions (user_id, word, definition) VALUES ($1, $2, $3);",
            [userId, word, definition]
        );
    } catch (e) {
        if (isDatabaseError(e) && e.code !== undefined) {
            const StorageErrorClass = ERROR_CODES[e.code];
            if (StorageErrorClass !== undefined) {
                throw new StorageErrorClass(e);
            }
        }
        throw e;
    }

};

export const getRandomLearningPair = async (userFilter: {userId: number}): Promise<LearningPair | null> => {
    const {userId} = userFilter;

    const result = await getStorage().query(
        "SELECT word, definition FROM definitions WHERE user_id = $1 ORDER BY RANDOM() LIMIT 1;",
        [userId],
    );

    if (result.rowCount === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        word: row.word,
        definition: row.definition,
    };
};
