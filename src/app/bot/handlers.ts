import { Keyboard } from "grammy/out/convenience/keyboard";

import {
    Command,
    responseCantAddWordTwice,
    responseGreeting,
    responseGreetingAgain,
    responseNothingAdded,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
    responseWordAdded,
} from "./commands";

import {
    StateDataCheckMap,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
    StateCheckRandomWord,
} from "../../domain/state";
import { createUser, getUser, resetState, setState, User } from "../../domain/user";
import { BotContext } from "../../lib/bot";
import { getLogger } from "../../lib/logger";

import { BotServerError } from "./errors";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { HandlerWithUser } from "./context";
import { createLearningPair, getRandomLearningPair } from "../../domain/vocabulary";
import { DuplicateError, isStorageError } from "../../lib/storage";

const logger = getLogger("bot/handlers");

const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).text(Command.CHECK_DEFINITION).row();

/**
 * @throws {BotServerError}
 */
export const onAddHandler: HandlerWithUser = async (ctx: BotContext): Promise<void> => {
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
    const maybeLearningPair = await getRandomLearningPair({userId: user.id});
    if (maybeLearningPair === null) {
        await ctx.reply(responseNothingAdded);
        return;
    }

    await setState<typeof StateCheckRandomWord>(
        user.id,
        StateCheckRandomWord,
        { ref: maybeLearningPair.definition }
    );
    await ctx.reply(maybeLearningPair.word);
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
        if (!checkGuard(user.stateInfo)) {
            throw new DomainStorageStateError(
                `user state(${user.state}) not match state info(${JSON.stringify(user.stateInfo)})`
            );
        }
        try {
            await createLearningPair({userId: user.id, word: user.stateInfo.word, definition: message});
        } catch (e) {
            if (isStorageError(e)) {
                if (e instanceof DuplicateError) {
                    await resetState(user.id);
                    await ctx.reply(responseCantAddWordTwice);
                    break;
                }
            }
            throw e;
        }
        await resetState(user.id);
        await ctx.reply(responseWordAdded);
        break;
    }
    case StateTypeWordToRemove:
        // TODO
        break;
    default:
        await resetState(user.id);
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
};
