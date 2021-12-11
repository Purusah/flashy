import { QueryResult } from "pg";
import { getStorage, StorageInternalError } from "../lib/storage";
import { Err } from "../lib/types";
import { DomainStorageStateError, DomainUserNotFoundError } from "./errors";

import {
    State,
    StateDefault,
    StateInfo,
} from "./state";


type UserTableRow = {user_id: number, state: State, state_data: StateInfo[State]};
export const UnknownStateError = new Error("Unknown state error");

export interface User {
    id: number;
    state: State;
    stateInfo: StateInfo[State];
}

const getDefaultUser = (): User => {
    return {
        id: 0,
        state: StateDefault,
        stateInfo: null,
    };
};
/**
 * @throws {DomainStorageStateError} on users amount more then 1
 * @throws {DomainUserNotFoundError} on user not found
 * @throws {DomainUserStateError} on user state don't match state data
 */
export const getUser = async (userId: number): Promise<User> => {
    const userRequestResult = await getStorage().query<UserTableRow>(
        "SELECT user_id, state, state_data FROM users WHERE user_id = $1;",
        [userId]
    );

    if (userRequestResult.rowCount > 1) {
        throw new DomainStorageStateError(`${userRequestResult.rowCount} rows found for the user id ${userId}`);
    }

    const userRowData = userRequestResult.rows[0];
    if (userRowData === undefined) {
        throw new DomainUserNotFoundError(`user id ${userId} not found`);
    }

    return {
        id: userRowData.user_id,
        state: userRowData.state,
        stateInfo: userRowData.state_data,
    };
};


export const resetState = async (userId: number): Promise<void> => {
    await setState(userId, StateDefault, null);
};

export const setState = async <T extends State>(userId: number, state: T, info: StateInfo[T]): Promise<void> => {
    await getStorage().query(
        "UPDATE users SET state = $1, state_data = $2 WHERE user_id = $3;",
        [state, info, userId]
    );
};

export const createUser = async (userId: number): Promise<[User, Err]> => {
    let res: QueryResult<{id: number}> | null = null;

    try {
        res = await getStorage().query("INSERT INTO users (user_id) VALUES ($1) RETURNING id;", [userId]);
        if (res.rowCount !== 1) {
            // TODO logging
            return [getDefaultUser(), StorageInternalError];
        }
    } catch (e) {
        return [getDefaultUser(), StorageInternalError];
    }
    if (typeof res.rows[0]?.id !== "number") {
        return [getDefaultUser(), StorageInternalError];
    }
    const user = getDefaultUser();
    user.id = res.rows[0].id;
    return [user, null];
};
