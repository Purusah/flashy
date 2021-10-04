import { Context, Bot as Grammy, BotConfig as GrammyConfig } from "grammy";
import { Pool } from "pg";

export interface BotConfig<C extends Context> extends GrammyConfig<C> {}

export class BotContext extends Context {}

export class Bot<C extends BotContext = BotContext> extends Grammy<C> {
    private storage: Pool;

    constructor(token: string, storage: Pool, config?: BotConfig<C>) {
        super(token, config);
        this.storage = storage;
    }
}
