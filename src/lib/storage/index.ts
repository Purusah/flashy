import { Pool } from "pg";

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");
export const StorageNotInitialized = new Error("Storage is not initialized");


const storage: {db: Pool | null} = {
    db: null
};

/**
 * @throws {StorageNotInitialized}
 */
export const getStorage = () => {
    if (storage.db === null) {
        throw StorageNotInitialized;
    }
    return storage.db;
};

export const initStorage = (config: {connectionString: string}) => {
    storage.db = new Pool({
        connectionString: config.connectionString,
        ssl: {
            rejectUnauthorized: false,
        },
    });
};
