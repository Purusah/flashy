import { responseUnknownError, responseWrongCommand } from "./commands";

import { BotContext } from "../../lib/bot";
import { State } from "../../domain/state";
import { getLogger } from "../../lib/logger";
import { getUser, resetState, User } from "../../domain/user";


export const UnacceptableUser = new Error("User Unacceptable");
export const UnacceptableMessage = new Error("Message Unacceptable");
export const InternalServerError = new Error("Internal Server Error");

export type Handler = (ctx: BotContext) => Promise<void>;
export type HandlerWithUser = (ctx: BotContext, user: User) => Promise<void>;

const logger = getLogger("bot/context");

export const mwErrorCatch = async (handler: Handler): Promise<Handler> => {
    return async (ctx: BotContext) => {
        try {
            await handler(ctx);
        } catch (e) {
            logger.error("middleware error catch", e);
            if (typeof ctx.from.id === "number") {
                await resetState(ctx.from.id);
            }
            await ctx.reply(responseUnknownError);
        }
    };
};

export const mwCheckUserState = async (allowedStates: Set<State>, handler: HandlerWithUser): Promise<Handler> => {
    return async (ctx: BotContext) => {
        // TODO add error handlers
        const user = await getUser(ctx.from.id);
        if (!allowedStates.has(user.state)) {
            await ctx.reply(responseWrongCommand);
            await resetState(user.id);
            logger.error(`expected state ${Array.from(allowedStates.values())} received state ${user.state}`);
            return;
        }

        await handler(ctx, user);
    };
};
