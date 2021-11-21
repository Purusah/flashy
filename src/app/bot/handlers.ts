import { Keyboard } from "grammy/out/convenience/keyboard";

import {
    Command,
    responseGreeting,
    responseGreetingAgain,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
    responseUnknownError
} from "./commands";

import { BotContext } from "../../lib/bot";
import { StateTypeDefinitionToAdd, StateTypeWordToAdd, StateTypeWordToRemove } from "../../domain/state";
import { createUser, getUser, resetState, setState, User } from "../../domain/user";
import { getLogger } from "../../lib/logger";
import { NoRowsFoundError } from "../../lib/storage";
import { Err } from "../../lib/types";

import { BotServerError } from "./errors";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { HandlerWithUser } from "./context";

const logger = getLogger("bot/handlers");

const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).text(Command.CHECK_DEFINITION).row();

/**
 * @throws {BotServerError}
 */
export const onAddHanlder: HandlerWithUser = async (ctx: BotContext): Promise<void> => {
    try {
        const user = await getUser(ctx.from.id);

        await setState(user.id, StateTypeWordToAdd, null);
    } catch (e) {
        if (e instanceof DomainStorageStateError) {
            throw new BotServerError("Storage error");
        }
        if (e instanceof DomainUserNotFoundError) {
            throw new BotServerError("Storage error");
        }
        if (e instanceof DomainUserStateError) {
            throw new BotServerError("Storage error");
        }
    }

    await ctx.reply(responseTypeWordToAdd);
};

export const onRemoveHandler = async (ctx: BotContext, user: User): Promise<void> => {
    await setState(user.id, StateTypeWordToRemove, null);
    await ctx.reply(responseTypeWordToRemove);
};

export const onCheckWord = async (ctx: BotContext, user: User): Promise<void> => {
    //
};

export const onCheckDefinition = async (ctx: BotContext, user: User): Promise<void> => {
    //
};

export const onCheckWordOrDefinition = async (ctx: BotContext, user: User): Promise<void> => {
    //
};

export const onStart = async (ctx: BotContext): Promise<void> => {
    try {
        await getUser(ctx.from.id);
    } catch (e) {
        if (e instanceof DomainUserNotFoundError) {
            await createUser(ctx.from.id);
            await ctx.reply(responseGreeting, {reply_markup: keyboardOnStart});
            return;
        }
        // ignore DomainUserStateError
        // ignore DomainStorageStateError
    }
    await resetState(ctx.from.id);
    await ctx.reply(responseGreetingAgain, {reply_markup: keyboardOnStart});
};

export const onMessageText = async (ctx: BotContext, user: User): Promise<void> => {
    const message = ctx.message?.text;
    if (message === undefined) {
        await ctx.reply("Sorry, I don't understand you. Please try again");
        return;
    }

    try {
        switch (user.state) {
        case StateTypeWordToAdd:
            await setState(user.id, StateTypeDefinitionToAdd, { word: message });
            await ctx.reply(responseTypeDefinitionToAdd);
            break;
        case StateTypeDefinitionToAdd:
            // save pair word - definition to db
            break;
        case StateTypeWordToRemove:
            // TODO
            break;
        default:
            await ctx.reply("Sorry, I don't understand you. Please try again");
        }
    } catch (e) {
        if (e instanceof DomainStorageStateError) {
            throw new BotServerError("Storage error");
        }
        if (e instanceof DomainUserNotFoundError) {
            throw new BotServerError("Storage error");
        }
        if (e instanceof DomainUserStateError) {
            throw new BotServerError("Storage error");
        }
    }
};
