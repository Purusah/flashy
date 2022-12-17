import { InlineKeyboard, Keyboard } from "grammy";

import { Command } from "../../adapter/external/tg/commands";

export const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).text(Command.EDIT_DEFINITION).row()
    .text(Command.GET_WORD).text(Command.LIST_WORDS).row()
    .text(Command.CHECK_WORD).row();

export const keyboardOnStudy = new Keyboard()
    .text(Command.CHECK_NEXT_WORD).row()
    .text(Command.CANCEL).row();

export class WordsListInlineKeyboardBuilder {
    private k: InlineKeyboard;
    private lastWordId: number | null;
    constructor(words: Array<{id: number, word: string}>) {
        this.k = new InlineKeyboard();
        this.lastWordId = words[words.length - 1]?.id ?? null;

        words.forEach(w => {
            this.k.text(w.word, `word:${w.id}`).row();
        });
    }

    public build(): InlineKeyboard {
        return this.k;
    }

    public withCloseButton(): WordsListInlineKeyboardBuilder {
        this.k.text("end", "list_word_close").row();
        return this;
    }

    public withNextButton(): WordsListInlineKeyboardBuilder {
        if (this.lastWordId === null) {
            return this;
        }

        this.k.text("next ->", `list_word_next:${this.lastWordId}`).row();
        return this;
    }
}

export const makeTextSpoiler = (text: string): string => {
    return `||${text}||`;
};

export const makeTextBold = (text: string): string => {
    return `*${text}*`;
};
