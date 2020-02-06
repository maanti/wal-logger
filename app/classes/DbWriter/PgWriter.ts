import DbWriter from "./DbWriter";
import {Client, ClientConfig} from "pg";
import Message from "../Message";
import IStrDict from "../../interfaces/IStrDict";

interface IRow {
    query: string;
    field: string;
    oldValue: string | number | undefined;
    newValue: string | number | undefined;
    type: "insert" | "update" | "delete";
    pKey: IStrDict<string | number>;
}

export default class PgWriter extends DbWriter {
    private readonly _client: Client;

    constructor(config: ClientConfig) {
        super();

        this._client = new Client(config);
    }

    public get client(): Client {
        return this._client;
    }

    public async connect(): Promise<void> {
        await this._client.connect();
    }

    public saveMessage(message: Message): void {
        const {diff, schema, table, type, pKey} = message;
        const query = `${schema}.${table}`;
        for (const field in diff) {
            if (!diff.hasOwnProperty(field)) {
                continue;
            }
            const {oldValue, newValue} = diff[field];
            const row: IRow = {
                query,
                field,
                oldValue,
                newValue,
                type,
                pKey
            };
            this.writeRow(row);
        }

    }

    private writeRow(row: IRow): void {
        const {
            query,
            field,
            oldValue,
            newValue,
            type,
            pKey
        } = row;
        this.client.query(`
            INSERT INTO log(table_name,
                            field,
                            old_value,
                            new_value,
                            operation_type_code,
                            pkey)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            query,
            field,
            oldValue,
            newValue,
            type,
            pKey
        ]);
    }
}
