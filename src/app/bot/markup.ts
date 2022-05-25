import { Keyboard } from "grammy/out/convenience/keyboard";

import { Command } from "../../adapter/external/tg/commands";

export const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).row();

export const keyboardOnStudy = new Keyboard()
    .text(Command.CHECK_NEXT_WORD).row()
    .text(Command.CANCEL).row();

export const makeTextSpoiler = (text: string): string => {
    return `||${text}||`;
};

export const makeTextBold = (text: string): string => {
    return `*${text}*`;
};
