import { QueryResult } from "pg";
import { NoRowsFoundError, pool, StorageInternalError } from "../storage";
import { Err } from "../types";

import {
    State,
    StateDefault,
    StateInfo,
    StateInfoDefinitionToAdd,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove
} from "./state";
// import { UserVocabulary } from "./vocabulary";


type UserTableRow = {user_id: number, state: string, state_data: unknown};
export const UnknownStateError = new Error("Unknown state error");

export interface User<T extends State> {
    id: number;
    state: T;
    stateInfo: StateInfo[T];
}

const getDefaultUser = <T extends State>(state: T): User<T> => {
    // Why does it work like this?
    // https://github.com/microsoft/TypeScript/issues/24085
    switch (state) {
    case StateDefault:
        return {
            id: 0,
            state: StateDefault,
            stateInfo: null,
        } as User<T>;
    case StateTypeWordToAdd:
        return {
            id: 0,
            state: StateTypeWordToAdd,
            stateInfo: null,
        } as User<T>;
    case StateTypeWordToRemove:
        return {
            id: 0,
            state: StateTypeWordToRemove,
            stateInfo: null,
        } as User<T>;
    case StateTypeDefinitionToAdd:
        return <User<T>>{
            id: 0,
            state: StateTypeDefinitionToAdd,
            stateInfo: {word: ""},
        };
    }

    return {
        id: 0,
        state: StateDefault,
        stateInfo: null,
    } as User<T>;
};


const userRowStateIsDefinitionToAdd = (state: any): state is StateInfoDefinitionToAdd => {
    if (state?.word === "string") {
        return true;
    }
    return false;
};



export const getUser = async (userId: number): Promise<[User<State>, Err]> => {
    const user = getDefaultUser(StateDefault);
    let res: QueryResult<UserTableRow> | null = null;
    try {
        res = await pool.query<UserTableRow>(
            "SELECT user_id, state, state_data FROM users WHERE user_id = $1;",
            [userId]
        );
    } catch (e) {
        // TODO logging
        return [user, StorageInternalError];
    }

    if (res.rowCount !== 1) {
        // TODO check more than one
        // TODO logging
        return [user, NoRowsFoundError];
    }

    const userData = res.rows[0];
    if (userData === undefined) {
        return [user, UnknownStateError];
    }

    if (userData.state_data === null) {
        user.stateInfo = null;
        switch (userData.state) {
        case StateDefault:
            return [getDefaultUser(StateDefault), null];
        case StateTypeWordToAdd:
            return [getDefaultUser(StateTypeWordToAdd), null];
        case StateTypeWordToRemove:
            return [getDefaultUser(StateTypeWordToRemove), null];
        default:
            return [getDefaultUser(StateDefault), UnknownStateError];
        }

    } else if (userData.state === StateTypeDefinitionToAdd && userRowStateIsDefinitionToAdd(userData.state_data)) {
        const user = getDefaultUser(StateTypeDefinitionToAdd);
        user.stateInfo = userData.state_data;
        return [user, null];
    }

    // TODO logging
    return [getDefaultUser(StateDefault), UnknownStateError];
};


export const resetState = async (userId: number): Promise<Err> => {
    const err = await setState(userId, StateDefault, null);
    return err;
};

export const setState = async <T extends State>(userId: number, state: T, info: StateInfo[T]): Promise<Err> => {
    const res = await pool.query(
        "UPDATE users SET state = $1, state_data = $2 WHERE user_id = $3;",
        [state, info, userId]
    );
    if (res.rowCount !== 1) {
        // TODO logging
        return StorageInternalError;
    }
    return null;
};

export const createUser = async (userId: number): Promise<[User<typeof StateDefault>, Err]> => {
    let res: QueryResult<{id: number}> | null = null;

    try {
        res = await pool.query("INSERT INTO users (userId) VALUES ($1) RETURNING id;", [userId]);
        if (res.rowCount !== 1) {
            // TODO logging
            return [getDefaultUser(StateDefault), StorageInternalError];
        }
    } catch (e) {
        return [getDefaultUser(StateDefault), StorageInternalError];
    }
    if (typeof res.rows[0]?.id !== "number") {
        return [getDefaultUser(StateDefault), StorageInternalError];
    }
    const user = getDefaultUser(StateDefault);
    user.id = res.rows[0].id;
    return [user, null];
};
