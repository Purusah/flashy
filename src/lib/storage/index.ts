import { Pool, DatabaseError } from "pg";

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");
export const StorageNotInitialized = new Error("Storage is not initialized");

export class StorageError extends Error {
    internalError: DatabaseError;

    constructor(databaseError: DatabaseError) {
        super();
        this.internalError = databaseError;
    }
}
export class DuplicateError extends StorageError {
    constructor(databaseError: DatabaseError) {
        super(databaseError);
        this.message = "duplicate entity";
    }
}

export class Storage extends Pool {}

export const ERROR_CODES: {[key: string]: typeof StorageError} = {
    "23505": DuplicateError
};

export const isDatabaseError = (error: any): error is DatabaseError => {
    if (error instanceof DatabaseError) {
        return true;
    }
    return false;
};

export const isStorageError = (error: any): error is StorageError => {
    if (error instanceof StorageError) {
        return true;
    }
    return false;
};


const storage: {db: Storage | null} = {
    db: null
};

/**
 * @throws {StorageNotInitialized}
 */
export const getStorage = (): Storage => {
    if (storage.db === null) {
        throw StorageNotInitialized;
    }
    return storage.db;
};

export const initStorage = (config: {connectionString: string, ssl?: {rejectUnauthorized: boolean}}) => {
    storage.db = new Pool({
        connectionString: config.connectionString,
        ssl: config.ssl,
    });
};
