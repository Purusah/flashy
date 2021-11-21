import { Pool } from "pg";

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");
export const StorageNotInitialized = new Error("Storage is not initialized");

export class Storage extends Pool {}

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
