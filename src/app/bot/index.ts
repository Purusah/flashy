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
import { BotContext } from "../../adapter/external/tg";
import { DuplicateError, isStorageError } from "../../adapter/internal/storage";
import { NoRowsAffected } from "../../adapter/internal/storage/DatabaseStorage";
import {
    State,
    StateDataCheckMap,
    StateStudyMode,
    StateTypeDefinitionToAdd,
    StateTypeWordToAdd,
    StateTypeWordToRemove,
} from "../../domain/state";
import { User, } from "../../domain/user";
import { DomainStorageStateError, DomainUserNotFoundError, DomainUserStateError } from "../../domain/errors";
import { FlashyDictionaryService, FlashyUserService } from "../../domain";
import { getLogger } from "../../lib/logger";
import {
    keyboardOnStart,
    keyboardOnStudy,
    makeTextBold,
    makeTextSpoiler,
    WordsListInlineKeyboardBuilder,
} from "./markup";
import { BotServerError, BotStateMismatch, isStateInfoMismatchError, isStateMismatchError } from "./errors";

const logger = getLogger("BotApp");

export const UnacceptableUser = new Error("User Unacceptable");
export const UnacceptableMessage = new Error("Message Unacceptable");
export const InternalServerError = new Error("Internal Server Error");

export type Handler = (ctx: BotContext) => Promise<void>;
export type HandlerWithUser = (ctx: BotContext, user: User) => Promise<void>;

export class BotApp {
    constructor(
        private readonly dictionaryService: FlashyDictionaryService,
        private readonly userService: FlashyUserService
    ) {}

    onAddHandler = async(ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["ADD"],
                this._onAddHandler,
            )
        );
        await h(ctx);
    };

    onCallbackQueryData = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                null,
                this._onCallbackQueryData,
            )
        );
        await h(ctx);
    };

    onCancel = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CANCEL"],
                this._onCancel,
            )
        );
        await h(ctx);
    };

    onCheckWord = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_WORD"],
                this._onCheckWord,
            )
        );
        await h(ctx);
    };

    onCheckDefinition = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_DEFINITION"],
                this._onCheckDefinition,
            )
        );
        await h(ctx);
    };

    onCheckWordOrDefinition = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["CHECK_WORD_DEFINITION"],
                this._onCheckWordOrDefinition,
            )
        );
        await h(ctx);
    };

    onMessageText = async (ctx: BotContext): Promise<void> => {
        // TODO limit to 512 characters
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                onTextMsgAllowedState,
                this._onMessageText,
            )
        );
        await h(ctx);
    };

    onListWords = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["LIST_WORDS"],
                this._onListWords,
            )
        );
        await h(ctx);
    };

    onRemoveHandler = async (ctx: BotContext): Promise<void> => {
        const h = await this.mwErrorCatch(
            await this.mwCheckUserState(
                CommandState["REMOVE"],
                this._onRemoveHandler,
            )
        );
        await h(ctx);
    };

    onStart = async(ctx: BotContext): Promise<void> => {
        const user = await this.userService.get(ctx.from.id);
        if (user === null) {
            await this.userService.create(ctx.from.id);
            await ctx.reply(responseGreeting, {reply_markup: keyboardOnStart});
            return;
        }

        await this.userService.resetState(user);
        await ctx.reply(responseGreetingAgain, {reply_markup: keyboardOnStart});
    };

    /**
     * @throws {BotServerError}
     * HandlerWithUser
     */
    private _onAddHandler = async (ctx: BotContext, user: User): Promise<void> => {
        try {
            await this.userService.setState(user, StateTypeWordToAdd, null);
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

    /**
     *
     * TODO:
     * * remove `ctx.callbackQuery?.data` undefined check
     * * log NaN word ids
     */
    private _onCallbackQueryData = async (ctx: BotContext, user: User): Promise<void> => {
        if (ctx.callbackQuery?.data === undefined) {
            await ctx.answerCallbackQuery();
            return;
        }

        const callbackDataParts = ctx.callbackQuery.data.split(":");
        const callbackDataPrefix = callbackDataParts[0];

        if (callbackDataPrefix === "word") {
            const wordId = Number(callbackDataParts[1]);
            if (Number.isNaN(wordId)) {
                await ctx.deleteMessage();
                await ctx.answerCallbackQuery(responseUnknownError);
                return;
            }

            const pair = await this.dictionaryService.get(user, wordId);
            if (pair === null) {
                await ctx.answerCallbackQuery(responseUnknownWord);
                return;
            }

            await ctx.reply(pair.word);
            await ctx.reply(pair.definition);
        } else if (callbackDataPrefix === "list_word_close") {
            await ctx.deleteMessage();
        } else if (callbackDataPrefix === "list_word_next") { // TODO check enum, not strings
            const nextId = Number(callbackDataParts[1]);
            if (Number.isNaN(nextId)) {
                await ctx.deleteMessage();
                await ctx.answerCallbackQuery(responseUnknownError);
                return;
            }
            const pairs = await this.dictionaryService.list(user, Number(callbackDataParts[1]));
            const keyboard = new WordsListInlineKeyboardBuilder(pairs);

            if (pairs.length === FlashyDictionaryService.MAX_WORDS_LIST_LENGTH) {
                keyboard.withNextButton();
            }

            await ctx.editMessageReplyMarkup({reply_markup: keyboard.withCloseButton().build()});
        }
        await ctx.answerCallbackQuery();
    };

    private _onCancel = async (ctx: BotContext, user: User): Promise<void> => {
        await this.userService.resetState(user);
        await ctx.reply(responseOkNext, {reply_markup: keyboardOnStart});
    };

    private _onCheckWord = async (ctx: BotContext, user: User): Promise<void> => {
        const maybeLearningPair = await this.dictionaryService.getRandom(user);
        if (maybeLearningPair === null) {
            await ctx.reply(responseNothingAdded);
            return;
        }

        await this.userService.setState<typeof StateStudyMode>(
            user,
            StateStudyMode,
            null
        );
        const word = `Word: ${makeTextBold(maybeLearningPair.word)}`;
        await ctx.reply(word, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});

        const definitions = `Definition: ${makeTextSpoiler(maybeLearningPair.definition)}`;
        await ctx.reply(definitions, {reply_markup: keyboardOnStudy, parse_mode: "MarkdownV2"});
    };

    private async _onCheckDefinition(ctx: BotContext, user: User): Promise<void> {
        const maybeLearningPair = await this.dictionaryService.getRandom(user);
        if (maybeLearningPair === null) {
            await ctx.reply(responseNothingAdded);
            return;
        }

        await this.userService.setState<typeof StateStudyMode>(
            user,
            StateStudyMode,
            null
        );
        await ctx.reply(maybeLearningPair.definition);
    }

    /**
     *
     * TODO:
     * * if no words in the next page -> don't show next button
     * * if previous words exists -> show 'back' button
     */
    private _onListWords = async (ctx: BotContext, user: User): Promise<void> => {
        const pairs = await this.dictionaryService.list(user, 0);
        const keyboard = new WordsListInlineKeyboardBuilder(pairs);

        if (pairs.length === FlashyDictionaryService.MAX_WORDS_LIST_LENGTH) {
            keyboard.withNextButton();
        }

        await ctx.reply(responseOkNext, {reply_markup: keyboard.withCloseButton().build()});
    };

    private _onCheckWordOrDefinition = async (_ctx: BotContext, _user: User): Promise<void> => {
        //
    };

    /**
     * @throws {DomainStorageStateError} on user state don't match state info
     */
    private _onMessageText = async (ctx: BotContext, user: User): Promise<void> => {
        const message = ctx.message?.text;
        if (message === undefined) {
            await ctx.reply("Sorry, I don't understand you. Please try again");
            return;
        }

        switch (user.state) {
        case StateTypeWordToAdd:
            this.userService.setState(user, StateTypeDefinitionToAdd, { word: message });
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
                await this.dictionaryService.create(user, {
                    word: user.stateInfo.word,
                    definition: message
                });
            } catch (e) {
                if (isStorageError(e)) {
                    if (e instanceof DuplicateError) {
                        await this.userService.resetState(user);
                        return;
                    }
                }
                throw e;
            }
            await this.userService.resetState(user);
            await ctx.reply(responseWordAdded);
            break;
        }
        case StateTypeWordToRemove:
            await this.dictionaryService.remove(user.id, message);
            await this.userService.resetState(user);
            await ctx.reply(responseWordRemoved);
            break;
        default:
            await ctx.reply("Sorry, I don't understand you. Please try again");
        }
    };

    private _onRemoveHandler = async (ctx: BotContext, user: User): Promise<void> => {
        await this.userService.setState(user, StateTypeWordToRemove, null);
        await ctx.reply(responseTypeWordToRemove);
    };

    private mwErrorCatch = async (handler: Handler): Promise<Handler> => {
        return async (ctx: BotContext) => {
            try {
                await handler(ctx);
            } catch (e) {
                if (typeof ctx.from.id === "number") {
                    await this.userService.resetState(User.new(ctx.from.id));
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
    };

    private mwCheckUserState = async (allowedStates: Set<State> | null, handler: HandlerWithUser): Promise<Handler> => {
        return async (ctx: BotContext) => {
            const user = await this.userService.get(ctx.from.id);
            if (!user) {
                throw new Error("TODO");
            }
            if (allowedStates !== null && !allowedStates.has(user.state)) {
                throw new BotStateMismatch("unexpected state", Array.from(allowedStates.values()), user.state);
            }

            await handler(ctx, user);
        };
    };

    static init(dictionaryService: FlashyDictionaryService, userService: FlashyUserService): BotApp {
        return new BotApp(dictionaryService, userService);
    }
}
