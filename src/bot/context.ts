import { responseUnknownError, responseWrongCommand } from "./commands";

import { BotContext } from "../lib/bot";
import { State } from "../lib/domain/state";
import { getLogger } from "../lib/logger";
import { getUser, resetState, User } from "../lib/domain/user";


export const UnacceptableUser = new Error("User Unacceptable");
export const UnacceptableMessage = new Error("Message Unacceptable");
export const InternalServerError = new Error("Internal Server Error");

export type Handler = (ctx: BotContext) => Promise<void>;

const logger = getLogger("bot/context");

export const mwErrorCatch = async (handler: Handler): Promise<Handler> => {
    return async (ctx: BotContext) => {
        try {
            await handler(ctx);
        } catch (e) {
            logger.error("middleware error catch", e);
            await ctx.reply(responseUnknownError);
        }
    };
};

export const mwCheckUserState = async (allowedStates: Set<State>, handler: Handler): Promise<Handler> => {
    return async (ctx: BotContext) => {
        const [user, err] = await getUser(ctx.from.id);
        if (!allowedStates.has(user.state)) {
            await ctx.reply(responseWrongCommand);
            const err = await resetState(user.id);
            if (err !== null) {
                logger.error("reseting state errors", err);
            }
            logger.error(`expected state ${allowedStates.values()} received state ${user.state}`);
            return;
        }

        await handler(ctx);
    };
};
