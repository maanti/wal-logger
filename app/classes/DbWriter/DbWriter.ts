import Message from "../Message";
import {Client} from "pg";

export default abstract class DbWriter {
    protected _client: Client;

    protected constructor(client: Client) {
        this._client = client;
    }

    public abstract saveMessage(message: Message): void;
}
