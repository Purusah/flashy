import http from "node:http";
import { webhookCallback } from "grammy";

import { Command } from "./bot/commands";
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
    StateDefault,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove
} from "./lib/domain/state";
import { pool } from "./lib/storage";


const isProduction = process.env.NODE_ENV === "production";
const BOT_URL = process.env.BOT_URL;
const BOT_TOKEN = process.env.BOT_TOKEN;

if (BOT_TOKEN === undefined) {
    console.error("BOT_TOKEN env not set");
    process.exit(1);
}

const app = http.createServer(async (req, res) => {
    if (req.url === "/webhook") {
        const handler = await webhookCallback(bot, "http");
        await handler(req, res);
        return;
    }
    res.statusCode = 404;
    res.end();
});

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
            new Set([StateDefault]),
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
            new Set([StateDefault]),
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
            new Set([StateDefault]),
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
            new Set([StateDefault]),
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
            new Set([StateDefault]),
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
            new Set([StateTypeWordToAdd, StateTypeDefinitionToAdd, StateTypeWordToRemove]),
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
    await pool.end();
    await bot.stop();
});
process.once("SIGTERM", async () => {
    await app.close();
    await pool.end();
    await bot.stop();
});

if (isProduction && BOT_URL !== undefined) {
    app.listen(80, "0.0.0.0");
    bot.api.setWebhook(BOT_URL);
} else {
    bot.start();
}