import { IDictionaryRepository, LearningPair, LearningPairWithId } from "./dictionary";
import {
    State,
    StateInfo,
    StateDefault
} from "./state";
import { IUserRepository, User } from "./user";

export class FlashyUserService {
    private constructor(
        private readonly userStorage: IUserRepository,
    ) { }

    async create(id: number): Promise<User> {
        await this.userStorage.createUser(id);
        return User.new(id);
    }

    async get(id: number): Promise<User | null> {
        return this.userStorage.getUser(id);
    }

    async setState<T extends State>(user: User, state: T, stateInfo: StateInfo[T]): Promise<User> {
        await this.userStorage.setState(user.id, state, stateInfo);
        return User.init(
            user.id,
            state,
            stateInfo
        );
    }

    async resetState(user: User): Promise<User> {
        await this.userStorage.setState(user.id, StateDefault, null);
        return User.init(user.id, StateDefault, null);
    }

    static init(userStorage: IUserRepository): FlashyUserService {
        return new FlashyUserService(userStorage);
    }
}

export class FlashyDictionaryService {
    private constructor(
        private readonly wordStorage: IDictionaryRepository,
    ) { }

    async create(user: User, pair: LearningPair): Promise<void> {
        await this.wordStorage.createWordsPair({userId: user.id, ...pair});
    }

    async getRandom(user: User): Promise<LearningPair | null> {
        return this.wordStorage.getRandomWordPairs({userId: user.id});
    }

    async list(user: User, fromId = 0): Promise<LearningPairWithId[]> {
        return this.wordStorage.listWordPairs(user.id, fromId, 5);
    }

    async remove(userId: number, word: string) {
        await this.wordStorage.removeWordsPair({ userId, word });
    }

    static init(wordsStorage: IDictionaryRepository): FlashyDictionaryService {
        return new FlashyDictionaryService(wordsStorage);
    }
}
