import http from "node:http";
import { webhookCallback } from "grammy";

import { Bot, BotContext } from "./adapter/external/tg";
import { Command } from "./adapter/external/tg/commands";
import { DatabaseDictionaryStorage, DatabaseUserStorage } from "./adapter/internal/storage/DatabaseStorage";
import { BotApp } from "./app/bot";
import { NewConfig } from "./app/config";
import { FlashyApp } from "./domain";
import { getLogger } from "./lib/logger";
import { IClosable } from "./lib/types";

const logger = getLogger("index");

const run = async () => {

    const config = NewConfig();

    const bot = await Bot.init({token: config.bot.token});

    // storage
    const dictionaryStorage = DatabaseDictionaryStorage.init(config.storage);
    const userStorage = DatabaseUserStorage.init(config.storage);

    //
    const flashyApp = FlashyApp.init(dictionaryStorage, userStorage);

    const botApp = BotApp.init(flashyApp);

    bot.command("start", async (ctx: BotContext) => {
        await botApp.onStart(ctx);
    });
    bot.hears(Command.ADD, async (ctx) => botApp.onAddHandler(ctx));
    bot.hears(Command.REMOVE, async (ctx) => botApp.onRemoveHandler(ctx));
    bot.hears(Command.CHECK_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CHECK_NEXT_WORD, async (ctx) => botApp.onCheckWord(ctx));
    bot.hears(Command.CANCEL, async (ctx) => botApp.onCancel(ctx));
    bot.hears(Command.CHECK_DEFINITION, async (ctx) => botApp.onCheckDefinition(ctx));
    bot.hears(Command.CHECK_WORD_DEFINITION, async (ctx) => botApp.onCheckWordOrDefinition(ctx));
    bot.on("message:text", async (ctx) => botApp.onMessageText(ctx));

    const toCloseOnExit: IClosable[] = [bot, dictionaryStorage, userStorage];

    /**
     * Graceful shutdown
    */
    process.once("SIGINT", async () => {
        await app.close();
        for (const i of toCloseOnExit) {
            await i.close();
        }
    });
    process.once("SIGTERM", async () => {
        await app.close();
        for (const i of toCloseOnExit) {
            await i.close();
        }
    });

    const app = http.createServer(async (req, res) => {
        if (req.url !== config.bot.path) {
            logger.warning(`bad request ${req.method} ${req.url}`);
            res.statusCode = 404;
            res.end();

        }
        let buffersByteLength = 0;
        const buffers: Uint8Array[] = [];

        for await (const chunk of req) {
            buffers.push(chunk);

            buffersByteLength += (<Uint8Array>chunk).byteLength;
            if (buffersByteLength > config.bot.maxRequestBodySize) {
                logger.warning(`request length exceed limit ${config.bot.maxRequestBodySize} MB`);
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

    if (config.env.isProduction) {
        if (config.bot.url || Number.isNaN(config.bot.port)) {
            throw new Error(`Bad server params host: ${config.bot.url} port: ${config.bot.url}`);
        }

        app.listen(config.bot.port);
        logger.info("bot started on web hooks");
        bot.api.setWebhook(`${config.bot.url}${config.bot.path}`);
    } else {
        logger.info("bot started on long pooling");
        bot.start();
    }
};

run().then();
