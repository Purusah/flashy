import { IDatabaseStorageConfig } from "../adapter/internal/storage/DatabaseStorage";

export interface IConfig {
    env: {
        isDebug: "1" | null;
        isProduction: boolean;
    }
    bot: {
        token: string;
        url: string;
        port: number;
        path: string;
        maxRequestBodySize: number;
    },
    storage: IDatabaseStorageConfig
}

export const NewConfig = (): IConfig => {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const BOT_STORAGE_URL = process.env.DATABASE_URL;
    if (BOT_TOKEN === undefined) {
        throw new Error("bot token not set");
    }

    if (BOT_STORAGE_URL === undefined) {
        throw new Error("bot storage url not set");
    }

    const isDebug = process.env.BOT_IS_DEBUG === "1" ? "1" : null;

    return {
        env: {
            isDebug,
            isProduction: process.env.NODE_ENV === "production",
        },
        bot: {
            token: BOT_TOKEN,
            url: process.env.DOMAIN || "",
            port: Number.parseInt(process.env.PORT || "4000"),
            path: `/${process.env.BOT_PATH || "flashy-bot-path"}`,
            maxRequestBodySize: 1_000_000,
        },
        storage: {
            url: BOT_STORAGE_URL,
            ssl: (isDebug === "1") ? null : { rejectUnauthorized: false }
        }
    };
};
