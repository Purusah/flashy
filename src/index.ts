import { webhookCallback } from "grammy";

import { HttpServer } from "./adapter/external/http";
import { Bot, BotContext } from "./adapter/external/tg";
import { Command } from "./adapter/external/tg/commands";
import { DatabaseDictionaryStorage, DatabaseUserStorage } from "./adapter/internal/storage/DatabaseStorage";
import { BotApp } from "./app/bot";
import { IConfig, NewConfig } from "./app/config";
import { FlashyDictionaryService, FlashyUserService } from "./domain";
import { getLogger } from "./lib/logger";
import { IClosable } from "./lib/types";

const logger = getLogger();

const run = async (config: IConfig): Promise<IClosable[]> => {
    const serverConfig = {maxRequestBodySizeBytes: config.bot.maxRequestBodySize, port: config.bot.port};

    // init internal adapters: storage
    const dictionaryStorage = DatabaseDictionaryStorage.init(config.storage);
    const userStorage = DatabaseUserStorage.init(config.storage);

    // init services
    const dictionaryService = FlashyDictionaryService.init(dictionaryStorage);
    const userService = FlashyUserService.init(userStorage);

    // init controllers
    const botApp = BotApp.init(dictionaryService, userService);

    // init external adapters
    const bot = await Bot.init({token: config.bot.token});
    const server = HttpServer.new(serverConfig, {[config.bot.path]: webhookCallback(bot, "http")});

    bot.command("start", async (ctx: BotContext) => botApp.onStart(ctx));
    bot.hears(Command.ADD, async (ctx) => botApp.onAddHandler(ctx));
    bot.hears(Command.REMOVE, async (ctx) => botApp.onRemoveHandler(ctx));
    bot.hears(Command.CHECK_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CHECK_NEXT_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CANCEL, async (ctx) => botApp.onCancel(ctx));
    bot.hears(Command.CHECK_DEFINITION, async (ctx) => botApp.onCheckDefinition(ctx));
    bot.hears(Command.CHECK_WORD_DEFINITION, async (ctx) => botApp.onCheckWordOrDefinition(ctx));
    bot.hears(Command.LIST_WORDS, async (ctx) => botApp.onListWords(ctx));
    bot.on("message:text", async (ctx) => botApp.onMessageText(ctx));
    bot.on("callback_query:data", (ctx) => botApp.onCallbackQueryData(ctx));

    if (config.env.isProduction) {
        server.listen();
        await bot.api.setWebhook(`${config.bot.url}${config.bot.path}`);
        logger.info("bot started on web hooks");
    } else {
        await bot.start();
        logger.info("bot started on long pooling");
    }

    return [server, bot, dictionaryStorage, userStorage];
};

(async () => {
    const config = NewConfig();
    const closeOnExit = await run(config);

    process.once("SIGINT", async () => {
        for (const i of closeOnExit) {
            await i.close();
        }
    });
    process.once("SIGTERM", async () => {
        for (const i of closeOnExit) {
            await i.close();
        }
    });

})().then();
