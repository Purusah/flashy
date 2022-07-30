export interface LearningPair {
    word: string;
    definition: string;
}

export interface LearningPairWithId extends LearningPair {
    id: number;
}

export interface IDictionaryRepository {
    createWordsPair(
        updateData: { userId: number, word: string, definition: string }
    ): Promise<void>

    getExactWordPair(filter: { userId: number, word: string }): Promise<LearningPair | null>

    getWordPair(filter: { userId: number, wordId: number }): Promise<LearningPair | null>

    getRandomWordPairs(userFilter: { userId: number }): Promise<LearningPair | null>

    listWordPairs(userId: number, fromId: number, limit: number): Promise<LearningPairWithId[]>

    removeWordsPair(
        updateData: { userId: number, word: string }
    ): Promise<void>

}
