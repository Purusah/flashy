import { webhookCallback } from "grammy";

import { Bot, BotContext } from "./adapter/external/tg";
import { Command } from "./adapter/external/tg/commands";
import { DatabaseDictionaryStorage, DatabaseUserStorage } from "./adapter/internal/storage/DatabaseStorage";
import { BotApp } from "./app/bot";
import { NewConfig } from "./app/config";
import { FlashyApp } from "./domain";
import { getLogger } from "./lib/logger";
import { IClosable } from "./lib/types";
import { HttpServer } from "./adapter/external/http";

const logger = getLogger("index");

const run = async (): Promise<IClosable[]> => {

    // read config
    const config = NewConfig();
    const serverConfig = {maxRequestBodySizeBytes: config.bot.maxRequestBodySize, port: config.bot.port};

    // init internal adapters: storage
    const dictionaryStorage = DatabaseDictionaryStorage.init(config.storage);
    const userStorage = DatabaseUserStorage.init(config.storage);

    // init services
    const flashyApp = FlashyApp.init(dictionaryStorage, userStorage);
    const botApp = BotApp.init(flashyApp); // TODO

    // init external adapters
    const bot = await Bot.init({token: config.bot.token});
    const server = HttpServer.new(serverConfig, {[config.bot.path]: await webhookCallback(bot, "http")});

    bot.command("start", async (ctx: BotContext) => botApp.onStart(ctx));
    bot.hears(Command.ADD, async (ctx) => botApp.onAddHandler(ctx));
    bot.hears(Command.REMOVE, async (ctx) => botApp.onRemoveHandler(ctx));
    bot.hears(Command.CHECK_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CHECK_NEXT_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CANCEL, async (ctx) => botApp.onCancel(ctx));
    bot.hears(Command.CHECK_DEFINITION, async (ctx) => botApp.onCheckDefinition(ctx));
    bot.hears(Command.CHECK_WORD_DEFINITION, async (ctx) => botApp.onCheckWordOrDefinition(ctx));
    bot.on("message:text", async (ctx) => botApp.onMessageText(ctx));

    if (config.env.isProduction) {
        server.listen();
        await bot.api.setWebhook(`${config.bot.url}${config.bot.path}`);
        logger.info("bot started on web hooks");
    } else {
        bot.start();
        logger.info("bot started on long pooling");
    }

    return [server, bot, dictionaryStorage, userStorage];
};

(async () => {
    const toCloseOnExit = await run();

    process.once("SIGINT", async () => {
        for (const i of toCloseOnExit) {
            await i.close();
        }
    });
    process.once("SIGTERM", async () => {
        for (const i of toCloseOnExit) {
            await i.close();
        }
    });

})().then();
