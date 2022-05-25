export type Err = Error | null;

export interface IClosable {
    close(): Promise<void>
}
