import {
    CommandState,
    onTextMsgAllowedState,
    responseGreeting,
    responseGreetingAgain,
    responseNothingAdded,
    responseOkNext,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
    responseUnknownError,
    responseUnknownWord,
    responseWordAdded,
    responseWordRemoved,
    responseWrongCommand,
} from "../../adapter/external/tg/commands";
import { keyboardOnStudy, keyboardOnStart, makeTextSpoiler, makeTextBold } from "./markup";

import {
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
    StateStudyMode,
    State,
} from "../../domain/state";
import { User } from "../../domain/user";
import { BotContext } from "../../adapter/external/tg";

import { BotServerError, BotStateMismatch, isStateInfoMismatchError, isStateMismatchError } from "./errors";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { FlashyApp } from "../../domain";
import { getLogger } from "../../lib/logger";
import { isStorageError } from "../../adapter/internal/storage";
import { NoRowsAffected } from "../../adapter/internal/storage/DatabaseStorage";

const logger = getLogger("BotApp");

export const UnacceptableUser = new Error("User Unacceptable");
export const UnacceptableMessage = new Error("Message Unacceptable");
export const InternalServerError = new Error("Internal Server Error");

export type Handler = (ctx: BotContext) => Promise<void>;
export type HandlerWithUser = (ctx: BotContext, user: User) => Promise<void>;

export class BotApp {
    constructor(private readonly flashyApp: FlashyApp) {}

    async onAddHandler(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["ADD"],
                this._onAddHandler,
            )
        );
        await h(ctx);
    }

    async onRemoveHandler(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["REMOVE"],
                this._onRemoveHandler,
            )
        );
        await h(ctx);}

    async onCheckWord(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_WORD"],
                this._onCheckWord,
            )
        );
        await h(ctx);
    }

    async onCancel(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CANCEL"],
                this._onCancel,
            )
        );
        await h(ctx);
    }

    async onCheckDefinition(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_DEFINITION"],
                this._onCheckDefinition,
            )
        );
        await h(ctx);
    }

    async onCheckWordOrDefinition(ctx: BotContext): Promise<void> {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_WORD_DEFINITION"],
                this._onCheckWordOrDefinition,
            )
        );
        await h(ctx);
    }

    async onMessageText(ctx: BotContext): Promise<void> {
        // TODO limit to 512 characters
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                onTextMsgAllowedState,
                this._onMessageText,
            )
        );
        await h(ctx);
    }

    /**
     * @throws {BotServerError}
     * HandlerWithUser
     */
    private async _onAddHandler(ctx: BotContext): Promise<void> {
        try {
            const user = await this.flashyApp.getUser(ctx.from.id);
            if (user === null) {
                throw new BotServerError("Storage error");
            }

            await this.flashyApp.setUserState(user, StateTypeWordToAdd, null);
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
    }

    private async _onRemoveHandler(ctx: BotContext, user: User): Promise<void> {
        await this.flashyApp.setUserState(user, StateTypeWordToRemove, null);
        await ctx.reply(responseTypeWordToRemove);
    }

    private async _onCheckWord(ctx: BotContext, user: User): Promise<void> {
        const maybeLearningPair = await this.flashyApp.getRandomWordsPair(user);
        if (maybeLearningPair === null) {
            await ctx.reply(responseNothingAdded);
            return;
        }

        await this.flashyApp.setUserState<typeof StateStudyMode>(
            user,
            StateStudyMode,
            null
        );
        const word = `Word: ${makeTextBold(maybeLearningPair.word)}`;
        await ctx.reply(word, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});

        const definitions = `Definition: ${makeTextSpoiler(maybeLearningPair.definition)}`;
        await ctx.reply(definitions, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});
    }

    private async _onCheckDefinition(ctx: BotContext, user: User): Promise<void> {
        const maybeLearningPair = await this.flashyApp.getRandomWordsPair(user);
        if (maybeLearningPair === null) {
            await ctx.reply(responseNothingAdded);
            return;
        }

        await this.flashyApp.setUserState<typeof StateStudyMode>(
            user,
            StateStudyMode,
            null
        );
        await ctx.reply(maybeLearningPair.definition);
    }

    private async _onCancel(ctx: BotContext, user: User): Promise<void> {
        await this.flashyApp.resetUserState(user);
        await ctx.reply(responseOkNext, {reply_markup: keyboardOnStart});
    }

    private async _onCheckWordOrDefinition(ctx: BotContext, user: User): Promise<void> {
        //
    }

    async onStart(ctx: BotContext): Promise<void> {
        const user = await this.flashyApp.getUser(ctx.from.id);
        if (user === null) {
            await this.flashyApp.createUser(ctx.from.id);
            await ctx.reply(responseGreeting, {reply_markup: keyboardOnStart});
            return;
        }

        await this.flashyApp.resetUserState(user);
        await ctx.reply(responseGreetingAgain, {reply_markup: keyboardOnStart});
    }

    /**
     * @throws {DomainStorageStateError} on user state don't match state info
     */
    private async _onMessageText(ctx: BotContext, user: User): Promise<void> {

        const message = ctx.message?.text;
        if (message === undefined) {
            await ctx.reply("Sorry, I don't understand you. Please try again");
            return;
        }

        await this.flashyApp.actOnUserState(user.id, message);

        switch (user.state) {
        case StateTypeWordToAdd:
            await ctx.reply(responseTypeDefinitionToAdd);
            return;
        case StateTypeDefinitionToAdd: {
            await ctx.reply(responseWordAdded);
            return;
        }
        case StateTypeWordToRemove:
            await ctx.reply(responseWordRemoved);
            return;
        default:
            await ctx.reply("Sorry, I don't understand you. Please try again");
        }
    }

    static init(flashyApp: FlashyApp): BotApp {
        return new BotApp(flashyApp);
    }

    private async mwErrorCatch(handler: Handler): Promise<Handler> {
        return async (ctx: BotContext) => {
            try {
                await handler(ctx);
            } catch (e) {
                if (typeof ctx.from.id === "number") {
                    await this.flashyApp.resetUserState(User.new(ctx.from.id));
                }

                if (isStateMismatchError(e)) {
                    logger.error(`expected state ${e.expectedStates} received state ${e.receivedState}`);
                    await ctx.reply(responseWrongCommand);
                    return;
                }
                if (isStateInfoMismatchError(e)) {
                    // just to make log msg line shorter
                    const recvState = JSON.stringify(e.receivedStateInfoObject);
                    logger.error(`expected state info ${e.expectedStateInfoType} received state ${recvState}`);
                    await ctx.reply(responseUnknownError, {reply_markup: keyboardOnStart});
                    return;
                }
                if ((isStorageError(e) && (e instanceof NoRowsAffected))) {
                    await ctx.reply(responseUnknownWord, {reply_markup: keyboardOnStart});
                    return;
                }

                logger.error("middleware error catch", e);
                await ctx.reply(responseUnknownError, {reply_markup: keyboardOnStart});
            }
        };
    }
    private async mwCheckUserState(allowedStates: Set<State>, handler: HandlerWithUser): Promise<Handler> {
        return async (ctx: BotContext) => {
            const user = await this.flashyApp.getUser(ctx.from.id);
            if (!user) {
                throw new Error("TODO");
            }
            if (!allowedStates.has(user.state)) {
                throw new BotStateMismatch("unexpected state", Array.from(allowedStates.values()), user.state);
            }

            await handler(ctx, user);
        };
    }
}
