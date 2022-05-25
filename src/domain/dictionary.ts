export interface LearningPair {
    word: string;
    definition: string;
}

export interface IDictionaryRepository {
    createWordsPair(
        updateData: { userId: number, word: string, definition: string }
    ): Promise<void>

    removeWordsPair(
        updateData: { userId: number, word: string }
    ): Promise<void>

    getRandomWordsPair(userFilter: { userId: number }): Promise<LearningPair | null>
}
