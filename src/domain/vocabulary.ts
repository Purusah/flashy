import { ERROR_CODES, getStorage, isDatabaseError, NoRowsAffected } from "../lib/storage";

const UnknownVocabularyError = new Error("unpredictable error");
const EmptyVocabularyError = new Error("user vocabulary empty");
const NoCurrentWordsError = new Error("current word not set");

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

export const removeLearningPair = async (
    updateData: {userId: number, word: string}
): Promise<void> => {
    const {userId, word} = updateData;

    const res = await getStorage().query(
        "DELETE FROM definitions WHERE user_id = $1 AND word = $2;",
        [userId, word]
    );
    if (res.rowCount === 0) {
        throw new NoRowsAffected();
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
