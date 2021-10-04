export type Commands = "ADD" | "REMOVE"
export type CommandRepository = {[Property in Commands]: string};

export const Command: CommandRepository = {
    ADD: <Commands>"🟢 Add word",
    REMOVE: <Commands>"🟥 Remove word",
};
