import { IDictionaryRepository, LearningPair } from "./dictionary";
import { DomainStorageStateError } from "./errors";
import {
    StateTypeWordToAdd,
    StateTypeDefinitionToAdd,
    StateDataCheckMap,
    StateTypeWordToRemove,
    State,
    StateInfo,
    StateDefault
} from "./state";
import { IUserRepository, User } from "./user";
import { isStorageError, DuplicateError } from "../adapter/internal/storage";
import { getLogger } from "../lib/logger";

const logger = getLogger("FlashyApp");

export class FlashyApp {
    private constructor(
        private readonly wordStorage: IDictionaryRepository,
        private readonly userStorage: IUserRepository,
    ) { }

    async createUser(id: number): Promise<User> {
        await this.userStorage.createUser(id);
        return User.new(id);
    }

    async getUser(id: number): Promise<User | null> {
        logger.info("getUser start");
        return this.userStorage.getUser(id);
    }

    async setUserState<T extends State>(user: User, state: T, stateInfo: StateInfo[T]): Promise<User> {
        await this.userStorage.setState(user.id, state, stateInfo);
        return User.init(
            user.id,
            state,
            stateInfo
        );
    }

    async resetUserState(user: User): Promise<User> {
        await this.userStorage.setState(user.id, StateDefault, null);
        return User.init(user.id, StateDefault, null);
    }

    async getRandomWordsPair(user: User): Promise<LearningPair | null> {
        return this.wordStorage.getRandomWordsPair({userId: user.id});
    }

    async removeUserWord(userId: number, word: string) {
        await this.wordStorage.removeWordsPair({ userId, word });
    }

    async actOnUserState(userId: number, message: string): Promise<void> {
        // TODO move to the BotApp
        let user = await this.userStorage.getUser(userId);
        if (user === null) {
            user = await this.userStorage.createUser(userId);
        }

        switch (user.state) {
        case StateTypeWordToAdd:
            this.userStorage.setState(user.id, StateTypeDefinitionToAdd, { word: message });
            return;
        case StateTypeDefinitionToAdd: {
            const checkGuard = StateDataCheckMap[user.state];
            if (!checkGuard(user.stateInfo)) {
                throw new DomainStorageStateError(
                    `user state(${user.state}) not match state info(${JSON.stringify(user.stateInfo)})`
                );
            }
            try {
                await this.wordStorage.createWordsPair({
                    userId: user.id,
                    word: user.stateInfo.word,
                    definition: message
                });
            } catch (e) {
                if (isStorageError(e)) {
                    if (e instanceof DuplicateError) {
                        await this.resetUserState(user);
                        return;
                    }
                }
                throw e;
            }
            await this.resetUserState(user);
            return;
        }
        case StateTypeWordToRemove:
            await this.wordStorage.removeWordsPair({ userId: user.id, word: message });
            await this.resetUserState(user);
            return;
        }
    }

    static init(wordsStorage: IDictionaryRepository, userStorage: IUserRepository): FlashyApp {
        return new FlashyApp(wordsStorage, userStorage);
    }
}
