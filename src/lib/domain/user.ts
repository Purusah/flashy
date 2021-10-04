// import { UserVocabulary } from "./vocabulary";
import { State, stateDefault } from "./state";
import { Err } from "../types";
import { createUser, getUser, setStateToUser } from "../storage";

export class User {
    private userId: number;
    state: State = stateDefault;
    // private stateData:
    // private vocabulary: UserVocabulary | null = null;

    constructor(userId: number, state: State) {
        this.userId = userId;
        this.state = state;
    }

    async resetState(): Promise<Err> {
        const err = await setStateToUser(this.userId, stateDefault, null);
        return err;
    }

    static async new(user_id: number): Promise<[User, Err]> {
        const newUser = new User(user_id, stateDefault);

        const err = await createUser(user_id);
        if (err !== null) {
            return [newUser, err];
        }

        return [newUser, null];
    }

    static async get(userId: number): Promise<[User, Err]> {
        return await getUser(userId);
    }
}
