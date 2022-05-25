import {
    State,
    StateDefault,
    StateInfo,
} from "./state";

export const UnknownStateError = new Error("Unknown state error");

export interface IUserRepository {
    getUser(userId: number): Promise<User | null>
    setState<T extends State>(userId: number, state: T, info: StateInfo[T]): Promise<void>
    createUser(userId: number): Promise<User>
}

export class User {
    private constructor(
        public id: number,
        public state: State,
        public stateInfo: StateInfo[State]
    ) {}

    static init(userId: number, state: State, stateInfo: StateInfo[State]): User {
        return new User(userId, state, stateInfo);
    }

    static new(userId: number): User {
        return new User(userId, StateDefault, null);
    }
}
