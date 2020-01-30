import Message from "../Message";

export default abstract class DbWriter {
    public abstract connect(): Promise<void>;

    public abstract saveMessage(message: Message): void;
}
