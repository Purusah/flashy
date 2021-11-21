import { Context, Bot as Grammy, BotConfig as GrammyConfig } from "grammy";
import { Message, User } from "grammy/out/platform.node";


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

export class Bot<C extends BotContext = BotContext> extends Grammy<C> {
    constructor(token: string, config?: BotConfig<C>) {
        super(token, config);
    }
}
