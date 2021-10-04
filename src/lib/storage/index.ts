import { Pool } from "pg";

import { State, stateDefault } from "../domain/state";
import { User } from "../domain/user";
import { Err } from "../types";

export const pool = new Pool();

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");


export const getUser = async (userId: number): Promise<[User, Err]> => {
    const user = new User(userId, stateDefault);
    let err: Err = null;

    try {
        const res = await pool.query("SELECT user_id, state, state_data FROM users WHERE user_id = $1;", [userId]);
        if (res.rowCount === 1) {
            user.state = res.rows[0].state; // TODO: validate state
        } else {
            // TODO add ToManyRowsFound just in case?
            err = NoRowsFoundError;
        }
    } catch (e) {
        err = StorageInternalError;
    }

    return [user, err];
};


export const setStateToUser = async (userId: number, state: State, info: unknown): Promise<Err> => {
    const res = await pool.query("UPDATE users SET state = $1, state_data = $2 WHERE user_id = $3;", [state, info, userId]);
    if (res.rowCount !== 1) {
        // TODO do sth
    }
    return null;
};


export const createUser = async (userId: number): Promise<Err> => {
    try {
        const res = await pool.query("INSERT INTO users (user_id) VALUES ($1);", [userId]);
        if (res.rowCount !== 1) {
            // TODO do sth
        }
    } catch (e) {
        return StorageInternalError;
    }
    return null;
};
