import { Pool } from "pg";
import { Keyboard } from "grammy";
import { Command } from "./bot/commands";
import { SafeUserStateContext } from "./bot/context";
import { Bot } from "./lib/bot";
import { pool, NoRowsFoundError } from "./lib/storage";
import { User } from "./lib/domain/user";
import { stateTypeDefinitionToAdd, stateTypeWordToAdd, stateTypeWordToRemove } from "./lib/domain/state";
import { Err } from "./lib/types";

const isProduction = process.env.NODE_ENV === "production";
const BOT_TOKEN = process.env.FLASHY_BOT_TOKEN;

if (BOT_TOKEN === undefined) {
    console.error("BOT_TOKEN env not set");
    process.exit(1);
}

const storage = new Pool();

const bot = new Bot(BOT_TOKEN, storage, { ContextConstructor: SafeUserStateContext });

const keyboardOnStart = new Keyboard()
    .text(Command.ADD).row()
    .text(Command.REMOVE).row();

// block bots and adding to chats
// bot.use();


bot.command("start", async (ctx) => {
    if (ctx.msg.from === undefined || ctx.msg.from.is_bot) {
        return;
    }

    let [user, err] = await ctx.user;
    if (err === null) {
        await ctx.reply("Nice to see you again!");
        return;
    } else if (err !== NoRowsFoundError) {
        await ctx.reply("Sorry, I can't start for now. Please, try again later", {reply_markup: keyboardOnStart});
        return;
    }

    [user, err] = await User.new(ctx.msg.from.id);
    if (err !== null) {
        await ctx.reply("Sorry, I can't start for now. Please, try again later", {reply_markup: keyboardOnStart});
        return;
    }
    await ctx.reply("Nice to meet you!", {reply_markup: keyboardOnStart});
});

bot.use(async (ctx: SafeUserStateContext, next) => {
    const [_, err] = await ctx.user;
    if (err !== null) {
        await ctx.reply("Please, type /start to use bot");
        return;
    }
    await next();
});

bot.hears(Command.ADD, async (ctx: SafeUserStateContext) => {
    // set state to type word
    // await ctx.user.addWord(ctx.msg.text);
    const [user, _] = await ctx.user; // TODO fix Decorator?

    await ctx.reply("Hey there");
});

bot.hears(Command.REMOVE, async (ctx) => {
    const [user, _] = await ctx.user; // TODO fix Decorator?

    await ctx.reply("Hey there");
});

bot.on("message:text", async (ctx) => {
    const [user, _] = await ctx.user; // TODO fix Decorator?

    const message = ctx.message;
    let errSwith: Err = null;
    switch (user.state) {
    case stateTypeWordToAdd:
        // TODO
        break;
    case stateTypeDefinitionToAdd:
        // TODO
        break;
    case stateTypeWordToRemove:
        // TODO
        break;
    default:
        errSwith = await user.resetState();
        if (errSwith !== null) {
            // logging
        }
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
});

// Enable graceful stop
process.once("SIGINT", async () => {
    await pool.end();
    await bot.stop();
});
process.once("SIGTERM", async () => {
    await pool.end();
    await bot.stop();
});

bot.start();
