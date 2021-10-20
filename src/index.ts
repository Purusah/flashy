import { Keyboard, webhookCallback } from "grammy";
import http from "http";
import { Pool } from "pg";
import {
    Command,
    responseGreeting,
    responseGreetingAgain,
    responseInternalErrorOnStart,
    responseTypeDefinitionToAdd,
    responseTypeWordToRemove,
    responseUnknownError,
    responseUnknownUser,
    responseWrongCommand
} from "./bot/commands";
import { SafeUserStateContext } from "./bot/context";
import { Bot } from "./lib/bot";
import {
    StateDefault,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove
} from "./lib/domain/state";
import { createUser, resetState, setState } from "./lib/domain/user";
import { NoRowsFoundError, pool } from "./lib/storage";
import { Err } from "./lib/types";


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

const storage = new Pool();

const bot = new Bot(
    BOT_TOKEN,
    storage,
    {
        ContextConstructor: SafeUserStateContext,
        client: {
            baseFetchConfig: {
                compress: true,
                // agent: new Agent({ keepAlive: true }),
            },
        },
    },
);

const keyboardOnStart = new Keyboard()
    .text(Command.ADD).row()
    .text(Command.REMOVE).row();

/**
 * Command to start using bot. Add user to database.
*/
bot.command("start", async (ctx) => {
    if (ctx.msg.from === undefined || ctx.msg.from.is_bot) {
        return;
    }

    let [user, err] = await ctx.user;
    if (err === null) {
        await ctx.reply(responseGreetingAgain);
        return;
    } else if (err !== NoRowsFoundError) {
        await ctx.reply(responseInternalErrorOnStart, {reply_markup: keyboardOnStart});
        return;
    }

    [user, err] = await createUser(ctx.msg.from.id);
    if (err !== null) {
        await ctx.reply(responseInternalErrorOnStart, {reply_markup: keyboardOnStart});
        return;
    }
    await ctx.reply(responseGreeting, {reply_markup: keyboardOnStart});
});

/**
 * Middleware to cut off unknown user and ask them to type /start
*/
bot.use(async (ctx: SafeUserStateContext, next) => {
    const [_, err] = await ctx.user;
    if (err !== null) {
        await ctx.reply(responseUnknownUser);
        return;
    }
    await next();
});

/**
 * Start branch to add new word
*/
bot.hears(Command.ADD, async (ctx: SafeUserStateContext) => {
    const [user, _] = await ctx.user; // checked with middleware
    if (user.state !== StateDefault) {
        await ctx.reply(responseWrongCommand);
        const _ = await resetState(user.id); // TODO logging for problems
        return;
    }

    await setState(user.id, StateTypeWordToAdd, null);
    await ctx.reply("Type word to add");
});

/**
 * Start branch to remove word
*/
bot.hears(Command.REMOVE, async (ctx) => {
    const [user, _] = await ctx.user;
    if (user.state !== StateDefault) {
        await ctx.reply(responseWrongCommand);
        const _ = await resetState(user.id); // TODO logging for problems
        return;
    }

    await setState(user.id, StateTypeWordToRemove, null);
    await ctx.reply(responseTypeWordToRemove);
});

/**
 * Generic handler to receive any type of text message
*/
bot.on("message:text", async (ctx) => {
    const [user, _] = await ctx.user;

    const message = ctx.message;
    if (typeof message !== "string") {
        await ctx.reply("Sorry, I don't understand you. Please try again");
        return;
    }
    let errSwith: Err = null;

    switch (user.state) {
    case StateTypeWordToAdd:
        errSwith = await setState(user.id, StateTypeDefinitionToAdd, { word: message });
        if (errSwith !== null) {
            await ctx.reply(responseUnknownError);
            break;
        }
        await ctx.reply(responseTypeDefinitionToAdd);
        break;
    case StateTypeDefinitionToAdd:
        // save pair word - definition to db
        break;
    case StateTypeWordToRemove:
        // TODO
        break;
    default:
        errSwith = await resetState(user.id);
        if (errSwith !== null) {
            // logging
        }
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
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
