import { responseUnknownError, responseWrongCommand } from "./commands";
import { keyboardOnStart } from "./markup";

import { BotContext } from "../../lib/bot";
import { State } from "../../domain/state";
import { getLogger } from "../../lib/logger";
import { getUser, resetState, User } from "../../domain/user";
import { BotStateMismatch, isStateInfoMismatchError, isStateMismatchError } from "./errors";


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
            if (typeof ctx.from.id === "number") {
                await resetState(ctx.from.id);
            }
            if (isStateMismatchError(e)) {
                logger.error(`expected state ${e.expectedStates} received state ${e.receivedState}`);
                await ctx.reply(responseWrongCommand);
                return;
            } else if (isStateInfoMismatchError(e)) {
                // just to make log msg line shorter
                const recvState = JSON.stringify(e.receivedStateInfoObject);
                logger.error(`expected state info ${e.expectedStateInfoType} received state ${recvState}`);
                await ctx.reply(responseUnknownError, {reply_markup: keyboardOnStart});
                return;
            }

            logger.error("middleware error catch", e);
            await ctx.reply(responseUnknownError, {reply_markup: keyboardOnStart});
        }
    };
};

export const mwCheckUserState = async (allowedStates: Set<State>, handler: HandlerWithUser): Promise<Handler> => {
    return async (ctx: BotContext) => {
        const user = await getUser(ctx.from.id);
        if (!allowedStates.has(user.state)) {
            throw new BotStateMismatch("unexpected state", Array.from(allowedStates.values()), user.state);
        }

        await handler(ctx, user);
    };
};
