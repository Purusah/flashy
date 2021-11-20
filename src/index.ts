import http from "node:http";
import { webhookCallback } from "grammy";

import { Command, CommandState } from "./bot/commands";
import { mwCheckUserState, mwErrorCatch } from "./bot/context";
import {
    onAddHanlder,
    onCheckDefinition,
    onCheckWord,
    onCheckWordOrDefinition,
    onMessageText,
    onRemoveHandler,
    onStart,
} from "./bot/handlers";

import { Bot, BotContext } from "./lib/bot";
import {
    State,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove
} from "./lib/domain/state";
import { getLogger } from "./lib/logger";
import { initStorage, getStorage } from "./lib/storage";


const isProduction = process.env.NODE_ENV === "production";
const BOT_URL = process.env.DOMAIN;
const BOT_PORT = Number.parseInt(process.env.PORT || "");
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_PATH = `/${process.env.BOT_PATH || ""}`;
const BOT_MAX_REQUEST_BODY_SIZE = 1_000_000; // 1MB
const BOT_STORAGE_URL = process.env.DATABASE_URL;

const logger = getLogger("index");

if (BOT_TOKEN === undefined) {
    logger.error("BOT_TOKEN not set");
    process.exit(1);
}

if (BOT_STORAGE_URL === undefined) {
    logger.error("DATABASE_URL not set");
    process.exit(1);
}

const onTextMsgAllowedState: Set<State> = new Set(
    [StateTypeWordToAdd, StateTypeDefinitionToAdd, StateTypeWordToRemove],
);

const bot = new Bot(
    BOT_TOKEN,
    {
        client: {
            baseFetchConfig: {
                compress: true,
                // agent: new Agent({ keepAlive: true }),
            },
        },
    },
);

initStorage({connectionString: BOT_STORAGE_URL});

/**
 * Command to start using bot. Add user to database.
*/
bot.command("start", async (ctx: BotContext) => {
    await onStart(ctx);
});

/**
 * Start branch to add new word
*/
bot.hears(Command.ADD, async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            CommandState["ADD"],
            onAddHanlder,
        )
    );
    await h(ctx);
});


/**
 * Start branch to remove word
*/
bot.hears(Command.REMOVE, async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            CommandState["REMOVE"],
            onRemoveHandler,
        )
    );
    await h(ctx);
});

/**
 * Get random word
*/
bot.hears(Command.CHECK_WORD, async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            CommandState["CHECK_WORD"],
            onCheckWord,
        )
    );
    await h(ctx);
});

/**
 * Get random definition
*/
bot.hears(Command.CHECK_DEFINITION, async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            CommandState["CHECK_DEFINITION"],
            onCheckDefinition,
        )
    );
    await h(ctx);
});

/**
 * Get random definition
*/
bot.hears(Command.CHECK_WORD_DEFINITION, async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            CommandState["CHECK_WORD_DEFINITION"],
            onCheckWordOrDefinition,
        )
    );
    await h(ctx);
});

/**
 * Generic handler to receive any type of text message
*/
bot.on("message:text", async (ctx) => {
    const h = await mwErrorCatch(
        await mwCheckUserState(
            onTextMsgAllowedState,
            onMessageText,
        )
    );
    await h(ctx);

});

/**
 * Graceful shutdown
*/
process.once("SIGINT", async () => {
    await app.close();
    await getStorage().end();
    await bot.stop();
});
process.once("SIGTERM", async () => {
    await app.close();
    await getStorage().end();
    await bot.stop();
});

const app = http.createServer(async (req, res) => {
    if (req.url !== BOT_PATH) {
        logger.warning(`bad request ${req.method} ${req.url}`);
        res.statusCode = 404;
        res.end();

    }
    let buffersByteLength = 0;
    const buffers: Uint8Array[] = [];

    for await (const chunk of req) {
        buffers.push(chunk);

        buffersByteLength += (<Uint8Array>chunk).byteLength;
        if (buffersByteLength > BOT_MAX_REQUEST_BODY_SIZE) {
            logger.warning(`request length exceed limit ${BOT_MAX_REQUEST_BODY_SIZE} MB`);
            res.statusCode = 403;
            res.end();
            return;
        }
    }

    if (buffersByteLength === 0) {
        logger.warning("request 0 length");
        res.statusCode = 403;
        res.end();
        return;
    }

    const data = Buffer.concat(buffers).toString();

    Object.defineProperties(req, {
        body: JSON.parse(data),
    });
    const handler = webhookCallback(bot, "http");
    await handler(req, res);
});

if (isProduction) {
    if (BOT_URL === undefined || Number.isNaN(BOT_PORT)) {
        throw new Error(`Bad server params host: ${BOT_URL} port: ${BOT_PORT}`);
    }

    app.listen(BOT_PORT);
    logger.info("bot started on web hooks");
    bot.api.setWebhook(`${BOT_URL}${BOT_PATH}`);
} else {
    logger.info("bot started on long pooling");
    bot.start();
}
