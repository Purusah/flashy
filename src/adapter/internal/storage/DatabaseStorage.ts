import * as Pg from "pg";
import { DuplicateError, StorageError, StorageInternalError } from ".";
import { IDictionaryRepository, LearningPair } from "../../../domain/dictionary";
import { DomainStorageStateError, DomainUserNotFoundError } from "../../../domain/errors";
import { State, StateInfo } from "../../../domain/state";
import { IUserRepository, User } from "../../../domain/user";
import { IClosable } from "../../../lib/types";

const pg = (Pg as any).default;

export class NoRowsAffected extends StorageError {
    constructor() {
        super(null);
        this.message = "no rows affected";
    }
}
type UserTableRow = { user_id: number, state: State, state_data: StateInfo[State] };
export const ERROR_CODES: { [key: string]: typeof StorageError } = {
    "23505": DuplicateError
};

export interface IDatabaseStorageConfig {
    url: string;
    ssl: { rejectUnauthorized: boolean } | null;
}

export const isDatabaseError = (error: any): error is Pg.DatabaseError => {
    if (error instanceof pg.DatabaseError) {
        return true;
    }
    return false;
};

export class DatabaseDictionaryStorage implements IDictionaryRepository, IClosable {
    private constructor (private readonly pool: Pg.Pool) { }

    static init(config: IDatabaseStorageConfig) {
        const pool = new pg.Pool({
            connectionString: config.url,
            ssl: config.ssl ?? undefined,
        });
        return new DatabaseDictionaryStorage(pool);
    }

    async createWordsPair(
        updateData: { userId: number, word: string, definition: string }
    ): Promise<void> {
        const { userId, word, definition } = updateData;

        try {
            await this.pool.query(
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
    }

    async removeWordsPair(
        updateData: { userId: number, word: string }
    ): Promise<void> {
        const { userId, word } = updateData;

        const res = await this.pool.query(
            "DELETE FROM definitions WHERE user_id = $1 AND word = $2;",
            [userId, word]
        );
        if (res.rowCount === 0) {
            throw new NoRowsAffected();
        }
    }

    async getRandomWordsPair(userFilter: { userId: number }): Promise<LearningPair | null> {
        const { userId } = userFilter;

        const result = await this.pool.query(
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
    }

    async close(): Promise<void> {
        return this.pool.end();
    }
}

export class DatabaseUserStorage implements IUserRepository, IClosable {
    private constructor (
        private readonly pool: Pg.Pool
    ) { }

    static init(config: IDatabaseStorageConfig): DatabaseUserStorage {
        const pool = new pg.Pool({
            connectionString: config.url,
            ssl: config.ssl ?? undefined,
        });
        return new DatabaseUserStorage(pool);
    }

    /**
     * @throws {DomainStorageStateError} on users amount more then 1
     * @throws {DomainUserNotFoundError} on user not found
     * @throws {DomainUserStateError} on user state don't match state data
     */
    async getUser (userId: number): Promise<User> {
        const userRequestResult = await this.pool.query<UserTableRow>(
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
    }

    async setState <T extends State>(userId: number, state: T, info: StateInfo[T]): Promise<void> {
        await this.pool.query(
            "UPDATE users SET state = $1, state_data = $2 WHERE user_id = $3;",
            [state, info, userId]
        );
    }

    async createUser (userId: number): Promise<User> {
        let res: Pg.QueryResult<{ id: number }> | null = null;

        try {
            res = await this.pool.query("INSERT INTO users (user_id) VALUES ($1) RETURNING id;", [userId]);
            if (res.rowCount !== 1) {
                throw StorageInternalError;
            }
        } catch (e) {
            throw StorageInternalError;
        }
        if (typeof res.rows[0]?.id !== "number") {
            throw StorageInternalError;
        }
        const user = User.new(userId);
        user.id = res.rows[0].id;
        return user;
    }

    async close(): Promise<void> {
        return this.pool.end();
    }

}
