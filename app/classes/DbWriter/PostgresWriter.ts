import DbWriter from "./DbWriter";
import {Client, ClientConfig} from "pg";


export default class PostgresWriter extends DbWriter {
    private client: Client;

    constructor() {
        super();

        const config: ClientConfig = {
            user: process.env.LOG_DB_USER || "gsoft",
            password: process.env.LOG_DB_PASSWORD || "gsoftGSOFT",
            database: process.env.LOG_DB_NAME || "wal-log",
            host: process.env.LOG_DB_HOST || "localhost",
            port: Number(process.env.LOG_DB_PORT) || 5432
        };

        this.client = new Client(config);
    }

    public async connect(): Promise<void> {
        await this.client.connect();
    }

    public async writeRow(change: any): Promise<void> {
        const {
            query,
            field,
            oldValue,
            newValue,
            operationTypeCode
        } = change;

        await this.client.query(`
            INSERT INTO log(query,
                            field,
                            old_value,
                            new_value,
                            operation_type_code)
            VALUES ($1,
                    $2,
                    $3,
                    $4,
                    $5)
        `, [
            query,
            field,
            oldValue,
            newValue,
            operationTypeCode
        ]);
    }
}
