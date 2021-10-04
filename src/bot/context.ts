import { Api } from "grammy";
import type { Update, UserFromGetMe } from "@grammyjs/types"; // TODO: abstract
import { BotContext } from "../lib/bot";

import { User } from "../lib/domain/user";
import { Err } from "../lib/types";

export const UnacceptableUser = new Error("User Unacceptable");
export const UnacceptableMessage = new Error("Message Unacceptable");
export const InternalServerError = new Error("Internal Server Error");

export class SafeUserStateContext extends BotContext {
    public user: Promise<[User, Err]>;
    constructor(update: Update, api: Api, me: UserFromGetMe) {
        super(update, api, me);

        if (this.from === undefined || this.from.is_bot) {
            // no reply to bot or in groups
            throw UnacceptableUser;
        }

        if (this.msg === undefined || this.msg.text === undefined) {
            // no reply to not text msg
            throw UnacceptableMessage;
        }

        // TODO try throw error here

        this.user = User.get(this.from.id);
    }
}
