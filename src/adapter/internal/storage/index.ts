import { DatabaseError } from "pg";

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");

export class StorageError extends Error {
    internalError: DatabaseError | null;

    constructor(databaseError: DatabaseError | null) {
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

export const isStorageError = (error: any): error is StorageError => {
    if (error instanceof StorageError) {
        return true;
    }
    return false;
};
