import { Keyboard } from "grammy/out/convenience/keyboard";

import { Command } from "./commands";

export const keyboardOnStart = new Keyboard()
    .text(Command.ADD).text(Command.REMOVE).row()
    .text(Command.CHECK_WORD).row();

export const keyboardOnStudy = new Keyboard()
    .text(Command.SHOW_CORRESPONDING_WORD).row()
    .text(Command.CHECK_NEXT_WORD).row()
    .text(Command.CANCEL).row();
