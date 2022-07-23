import { InlineKeyboard, Keyboard } from "grammy/out/convenience/keyboard";

import { Command } from "../../adapter/external/tg/commands";

export const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).row()
    .text(Command.LIST_WORDS).row();

export const keyboardOnStudy = new Keyboard()
    .text(Command.CHECK_NEXT_WORD).row()
    .text(Command.CANCEL).row();

export const keyboardOnListWordsBuilder = (words: Array<{id: number, word: string}>): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    words.forEach(w => {
        keyboard.text(w.word, `word:${w.id}`).row();
    });

    // add type with prefixes
    keyboard.text("next ->", `list_word_page:${words[words.length - 1]?.id}`).row(); // TODO get rid of ?
    return keyboard;
};

export const keyboardNoMoreWordsBuilder = (): InlineKeyboard => {
    const keyboard = new InlineKeyboard();
    keyboard.text("end", "list_word_close").row();
    return keyboard;
};

export const makeTextSpoiler = (text: string): string => {
    return `||${text}||`;
};

export const makeTextBold = (text: string): string => {
    return `*${text}*`;
};
