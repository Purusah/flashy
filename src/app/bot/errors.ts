import { State } from "../../domain/state";

export class BotBaseError extends Error {}

export class BotUserInputError extends BotBaseError {}
export class BotServerError extends BotBaseError{}
export class BotStateMismatch extends BotBaseError {
    public expectedStates: State[];
    public receivedState: State;
    constructor(message: string, expectedStates: State[], receivedState: State) {
        super(message);
        this.expectedStates = expectedStates;
        this.receivedState = receivedState;
    }
}

export const isStateMismatchError = (err: any): err is BotStateMismatch => {
    return err instanceof BotStateMismatch;
};

export class BotStateInfoMismatch extends BotBaseError {
    public expectedStateInfoType: string;
    public receivedStateInfoObject: object | null;
    constructor(message: string, expectedStateInfoType: string, receivedStateInfoObject: object | null) {
        super(message);
        this.expectedStateInfoType = expectedStateInfoType;
        this.receivedStateInfoObject = receivedStateInfoObject;
    }
}

export const isStateInfoMismatchError = (err: any): err is BotStateInfoMismatch => {
    return err instanceof BotStateInfoMismatch;
};
