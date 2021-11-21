import { Keyboard } from "grammy/out/convenience/keyboard";

import {
    Command,
    responseGreeting,
    responseGreetingAgain,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
} from "./commands";

import {
    StateDataCheckMap,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove
} from "../../domain/state";
import { createUser, getUser, resetState, setState, User } from "../../domain/user";
import { BotContext } from "../../lib/bot";
import { getLogger } from "../../lib/logger";

import { BotServerError } from "./errors";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { HandlerWithUser } from "./context";
import { createLearningPair } from "../../domain/vocabulary";

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

/**
 * @throws {DomainStorageStateError} on user state don't match state info
 */
export const onMessageText = async (ctx: BotContext, user: User): Promise<void> => {
    const message = ctx.message?.text;
    if (message === undefined) {
        await ctx.reply("Sorry, I don't understand you. Please try again");
        return;
    }

    switch (user.state) {
    case StateTypeWordToAdd:
        await setState(user.id, StateTypeDefinitionToAdd, { word: message });
        await ctx.reply(responseTypeDefinitionToAdd);
        break;
    case StateTypeDefinitionToAdd: {
        const checkGuard = StateDataCheckMap[user.state];
        if (checkGuard(user.stateInfo)) {
            await createLearningPair({userId: user.id, word: user.stateInfo.word, definition: message});
            await resetState(user.id);
            return;
        }
        throw new DomainStorageStateError(
            `user state(${user.state}) not match state info(${JSON.stringify(user.stateInfo)})`
        );
    }
    case StateTypeWordToRemove:
        // TODO
        break;
    default:
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
};
