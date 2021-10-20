import { Pool } from "pg";

export const pool = new Pool();

export const StorageInternalError = new Error("Unpredictable Storage Error");
export const NoRowsFoundError = new Error("No Rows Found");
