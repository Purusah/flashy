import sqlite3, {type Database as TypeDatabase} from "sqlite3";
import { IDatabaseStorageConfig, StorageInternalError } from ".";
import { IDictionaryRepository, LearningPair, LearningPairWithId } from "../../../domain/dictionary";
import { DomainStorageStateError, DomainUserNotFoundError } from "../../../domain/errors";
import { State, StateInfo } from "../../../domain/state";
import { IUserRepository, User } from "../../../domain/user";
import { IClosable } from "../../../lib/types";

const {OPEN_READWRITE, OPEN_CREATE, Database } = sqlite3;

export class DatabaseDictionaryStorage implements IDictionaryRepository, IClosable {
    // @ts-ignore
    private constructor (private readonly pool: TypeDatabase) { }

    async createWordsPair(
        updateData: { userId: number, word: string, definition: string }
    ): Promise<void> {
        const { userId, word, definition } = updateData;
        return new Promise((resolve, reject) => {
            this.pool.run(
                "INSERT INTO definitions (user_id, word, definition) VALUES ($1, $2, $3);",
                [userId, word, definition],
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
        });
    }

    async getExactWordPair(filter: { userId: number; word: string; }): Promise<LearningPair | null> {
        const { userId, word } = filter;

        return new Promise((resolve, reject) => {
            this.pool.all(
                "SELECT word, definition FROM definitions WHERE word = $1 AND user_id = $2 LIMIT 1;",
                [word, userId],
                (err, rows) => {
                    if (err !== null) {
                        reject(err);
                    }
                    if (rows.length=== 0) {
                        resolve(null);
                    }

                    const row = rows[0];

                    resolve({
                        word: row.word,
                        definition: row.definition,
                    });
                }
            );
        });
    }

    async getWordPair(filter: { userId: number, wordId: number }): Promise<LearningPair | null> {
        const { userId, wordId } = filter;
        return new Promise((resolve, reject) => {
            this.pool.all(
                "SELECT word, definition FROM definitions WHERE id = $1 AND user_id = $2 LIMIT 1;",
                [wordId, userId],
                (err, rows) => {
                    if (err !== null) {
                        reject(err);
                    }
                    if (rows.length=== 0) {
                        resolve(null);
                    }

                    const result = rows[0];

                    resolve({
                        word: result.word,
                        definition: result.definition,
                    });
                }
            );
        });
    }

    async getRandomWordPairs(userFilter: { userId: number }): Promise<LearningPair | null> {
        const { userId } = userFilter;

        return new Promise((resolve, reject) => {
            this.pool.all(
                "SELECT word, definition FROM definitions WHERE user_id = $1 ORDER BY RANDOM() LIMIT 1;",
                [userId],
                (err, rows) => {
                    if (err !== null) {
                        reject(err);
                    }
                    if (rows.length=== 0) {
                        resolve(null);
                    }

                    const result = rows[0];

                    resolve({
                        word: result.word,
                        definition: result.definition,
                    });
                }
            );
        });
    }

    async listWordPairs(userId: number, fromId: number, limit: number): Promise<LearningPairWithId[]> {
        return new Promise((resolve, reject) => {
            this.pool.all(
                `SELECT
                    id,
                    word,
                    definition
                FROM definitions
                WHERE user_id = $1
                    AND id > $2
                ORDER BY id
                LIMIT $3;`,
                [userId, fromId, limit],
                (err, rows) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve(rows);
                }
            );
        });
    }

    async removeWordsPair(
        updateData: { userId: number, word: string }
    ): Promise<void> {
        const { userId, word } = updateData;

        return new Promise((resolve, reject) => {
            this.pool.run(
                "DELETE FROM definitions WHERE user_id = $1 AND word = $2;",
                [userId, word],
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
        });
    }

    async updateWordPairDefinition(update: { userId: number; word: string; definition: string; }): Promise<void> {
        const { userId, word, definition } = update;

        return new Promise((resolve, reject) => {
            this.pool.run(
                "UPDATE definitions SET definition = $1 WHERE word = $2 AND user_id = $3;",
                [definition, word, userId],
                (err) => {
                    if (err !== null) {
                        reject(err);
                    }
                    resolve();
                }
            );
        });
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.close((err) => {
                if (err !== null) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    static init(config: IDatabaseStorageConfig): Promise<DatabaseDictionaryStorage> {
        return new Promise((resolve, reject) => {
            const db = new Database(config.url, OPEN_READWRITE | OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                }
            });
            db.once("open", () => {
                resolve(new DatabaseDictionaryStorage(db));
            });
        });
    }}

export class DatabaseUserStorage implements IUserRepository, IClosable {
    private constructor (private readonly pool: TypeDatabase) { }

    async createUser (userId: number): Promise<User> {
        return new Promise((resolve, reject) => {
            this.pool.all("INSERT INTO users (user_id) VALUES ($1) RETURNING id;", [userId], (err, rows) => {
                if (err !== null) {
                    reject(err);
                }
                if (rows.length !== 1) {
                    reject(StorageInternalError);
                }
                if (typeof rows[0]?.id !== "number") {
                    reject(StorageInternalError);
                }
                const user = User.new(userId);
                user.id = rows[0].id;
                resolve(user);
            });
        });
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.close((err) => {
                if (err !==null) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    /**
     * @throws {DomainStorageStateError} on users amount more then 1
     * @throws {DomainUserNotFoundError} on user not found
     * @throws {DomainUserStateError} on user state don't match state data
     */
    async getUser (userId: number): Promise<User> {
        return new Promise((resolve, reject) => {
            this.pool.all(
                "SELECT user_id, state, state_data FROM users WHERE user_id = $1;",
                [userId],
                (error, rows) => {
                    if (error !== null) {
                        reject(error);
                    }
                    if (rows.length> 1) {
                        reject(
                            new DomainStorageStateError(`${rows.length} rows found for the user id ${userId}`)
                        );
                    }

                    const userRowData = rows[0];
                    if (userRowData === undefined) {
                        reject(new DomainUserNotFoundError(`user id ${userId} not found`));
                        return;
                    }

                    resolve({
                        id: userRowData.user_id,
                        state: userRowData.state,
                        stateInfo: JSON.parse(userRowData.state_data),
                    });
                }
            );
        });
    }

    async setState <T extends State>(userId: number, state: T, info: StateInfo[T]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.run(
                "UPDATE users SET state = $1, state_data = $2 WHERE user_id = $3;",
                [state, JSON.stringify(info), userId],
                (err) => {
                    if (err !== null) {
                        reject(err);
                        return;
                    }
                    resolve();
                }
            );
        });
    }

    static init(config: IDatabaseStorageConfig): Promise<DatabaseUserStorage> {
        return new Promise((resolve, reject) => {
            const db = new Database(config.url, OPEN_CREATE | OPEN_READWRITE, (err) => {
                if (err) {
                    return reject(err);
                }
            });
            db.once("open", () => {
                resolve(new DatabaseUserStorage(db));
            });
        });
    }

}
