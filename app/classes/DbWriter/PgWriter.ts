import DbWriter from "./DbWriter";
import {Client, ClientConfig} from "pg";
import Message from "../Message";
import IStrDict from "../../interfaces/IStrDict";

interface IRow {
    query: string;
    field: string;
    oldValue: string | number;
    newValue: string | number;
    type: "insert" | "update" | "delete";
    pKey: IStrDict<string | number>;
}

export default class PgWriter extends DbWriter {
    private readonly _client: Client;

    constructor() {
        super();

        const config: ClientConfig = {
            user: process.env.LOG_DB_USER,
            password: process.env.LOG_DB_PASSWORD,
            database: process.env.LOG_DB_NAM,
            host: process.env.LOG_DB_HOST,
            port: Number(process.env.LOG_DB_PORT)
        };

        this._client = new Client(config);
    }

    public get client() {
        return this._client;
    }

    public async connect(): Promise<void> {
        await this._client.connect();
    }

    public saveMessage(message: Message): void {
        const {diff, schema, table, type, pKey} = message;
        const query = `${schema}.${table}`;
        for (const field in diff) {
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
            INSERT INTO log(query,
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
