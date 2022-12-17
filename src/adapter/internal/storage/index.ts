export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");

export class StorageError extends Error {
    constructor() {
        super();
    }
}

export class DuplicateError extends StorageError {
    constructor() {
        super();
        this.message = "duplicate entity";
    }
}

export class NoRowsAffected extends StorageError {
    constructor() {
        super();
        this.message = "no rows affected";
    }
}

export interface IDatabaseStorageConfig {
    url: string;
    ssl: { rejectUnauthorized: boolean } | null;
}

export const isStorageError = (error: any): error is StorageError => {
    if (error instanceof StorageError) {
        return true;
    }
    return false;
};
