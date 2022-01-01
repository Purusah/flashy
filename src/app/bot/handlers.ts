import {
    responseCantAddWordTwice,
    responseGreeting,
    responseGreetingAgain,
    responseNothingAdded,
    responseOkNext,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
    responseWordAdded,
    responseWordRemoved,
} from "./commands";
import { HandlerWithUser } from "./context";
import { BotStateInfoMismatch, BotStateMismatch } from "./errors";
import { keyboardOnStudy, keyboardOnStart, makeTextSpoiler, makeTextBold } from "./markup";

import {
    StateDataCheckMap,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
    StateStudyMode,
} from "../../domain/state";
import { createUser, getUser, resetState, setState, User } from "../../domain/user";
import { BotContext } from "../../lib/bot";

import { BotServerError } from "./errors";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { createLearningPair, getRandomLearningPair, removeLearningPair } from "../../domain/vocabulary";
import { DuplicateError, isStorageError, NoRowsAffected } from "../../lib/storage";

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

    await setState<typeof StateStudyMode>(
        user.id,
        StateStudyMode,
        null
    );
    const word = `Word: ${makeTextBold(maybeLearningPair.word)}`;
    await ctx.reply(word, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});

    const definitions = `Definition: ${makeTextSpoiler(maybeLearningPair.definition)}`;
    await ctx.reply(definitions, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});
};

export const onCheckDefinition = async (ctx: BotContext, user: User): Promise<void> => {
    const maybeLearningPair = await getRandomLearningPair({userId: user.id});
    if (maybeLearningPair === null) {
        await ctx.reply(responseNothingAdded);
        return;
    }

    await setState<typeof StateStudyMode>(
        user.id,
        StateStudyMode,
        null
    );
    await ctx.reply(maybeLearningPair.definition);
};

export const onCancel = async (ctx: BotContext, user: User): Promise<void> => {
    await resetState(user.id);
    await ctx.reply(responseOkNext, {reply_markup: keyboardOnStart});
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
        return;
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
                    return;
                }
            }
            throw e;
        }
        await resetState(user.id);
        await ctx.reply(responseWordAdded);
        return;
    }
    case StateTypeWordToRemove:
        await removeLearningPair({userId: user.id, word: message});
        await resetState(user.id);
        await ctx.reply(responseWordRemoved);
        return;
    default:
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
};
