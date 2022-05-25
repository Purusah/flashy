import { Context, Bot as Grammy, BotConfig as GrammyConfig } from "grammy";
import { Message, User } from "grammy/out/platform.node";
import { IClosable } from "../../../lib/types";

export interface BotConfig<C extends Context> extends GrammyConfig<C> {}

export class BotError extends Error {}
export class UnacceptableUserError extends BotError {}
export class UnacceptableMessageError extends BotError {}

export class BotContext extends Context {
    override get from(): User {
        if (super.from === undefined || super.from.is_bot) {
            throw new UnacceptableUserError("Bad user");
        }

        return super.from;
    }

    override get msg(): Message {
        if (super.msg === undefined || super.msg.from === undefined) {
            throw new UnacceptableMessageError("Bad message");
        }

        return super.msg;
    }
}

export class Bot<C extends BotContext = BotContext> extends Grammy<C> implements IClosable {
    constructor(token: string, config?: BotConfig<C>) {
        super(token, config);
    }

    async close(): Promise<void> {
        return this.stop();
    }

    static async init(config: {token: string}): Promise<Bot<BotContext>> {
        const bot = new Bot(config.token, {
            client: {
                baseFetchConfig: {
                    compress: true,
                    // agent: new Agent({ keepAlive: true }),
                },
            },
        });

        await bot.api.setMyCommands([
            { command: "start", description: "(Re)start the bot" },
            { command: "help", description: "Show help text" },
            // { command: "settings", description: "Open settings" },
        ]);

        return bot;
    }
}
