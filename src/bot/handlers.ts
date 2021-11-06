import { Keyboard } from "grammy/out/convenience/keyboard";

import {
    Command,
    responseGreeting,
    responseGreetingAgain,
    responseInternalErrorOnStart,
    responseTypeDefinitionToAdd,
    responseTypeWordToAdd,
    responseTypeWordToRemove,
    responseUnknownError
} from "./commands";

import { BotContext } from "../lib/bot";
import { StateTypeDefinitionToAdd, StateTypeWordToAdd, StateTypeWordToRemove } from "../lib/domain/state";
import { createUser, getUser, resetState, setState } from "../lib/domain/user";
import { NoRowsFoundError } from "../lib/storage";
import { Err } from "../lib/types";


const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).text(Command.CHECK_DEFINITION).row();


export const onAddHanlder = async (ctx: BotContext): Promise<void> => {
    const [user, _] = await getUser(ctx.from.id);
    await setState(user.id, StateTypeWordToAdd, null);
    await ctx.reply(responseTypeWordToAdd);
};

export const onRemoveHandler = async (ctx: BotContext): Promise<void> => {
    const [user, _] = await getUser(ctx.from.id);
    await setState(user.id, StateTypeWordToRemove, null);
    await ctx.reply(responseTypeWordToRemove);
};

export const onCheckWord = async (ctx: BotContext): Promise<void> => {
    //
};

export const onCheckDefinition = async (ctx: BotContext): Promise<void> => {
    //
};

export const onCheckWordOrDefinition = async (ctx: BotContext): Promise<void> => {
    //
};

export const onStart = async (ctx: BotContext): Promise<void> => {
    const [user, err] = await getUser(ctx.from.id);
    if (err === null) {
        await ctx.reply(responseGreetingAgain);
        await resetState(ctx.from.id);
        return;
    } else if (err !== NoRowsFoundError) {
        await ctx.reply(responseInternalErrorOnStart, {reply_markup: keyboardOnStart});
        return;
    }

    const [newUser, errOnUserCreate] = await createUser(ctx.from.id);
    if (errOnUserCreate !== null) {
        await ctx.reply(responseInternalErrorOnStart, {reply_markup: keyboardOnStart});
        return;
    }

    await ctx.reply(responseGreeting, {reply_markup: keyboardOnStart});
};

export const onMessageText = async (ctx: BotContext): Promise<void> => {
    const [user, _] = await getUser(ctx.from.id);

    const message = ctx.message;
    if (typeof message !== "string") {
        await ctx.reply("Sorry, I don't understand you. Please try again");
        return;
    }
    let errSwith: Err = null;

    switch (user.state) {
    case StateTypeWordToAdd:
        errSwith = await setState(user.id, StateTypeDefinitionToAdd, { word: message });
        if (errSwith !== null) {
            await ctx.reply(responseUnknownError);
            break;
        }
        await ctx.reply(responseTypeDefinitionToAdd);
        break;
    case StateTypeDefinitionToAdd:
        // save pair word - definition to db
        break;
    case StateTypeWordToRemove:
        // TODO
        break;
    default:
        errSwith = await resetState(user.id);
        if (errSwith !== null) {
            // logging
        }
        await ctx.reply("Sorry, I don't understand you. Please try again");
    }
};
