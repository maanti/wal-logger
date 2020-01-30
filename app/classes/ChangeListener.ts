import {Client} from "pg";
import {EventEmitter} from "events";
import IQuery from "../interfaces/IQuery";
import IOptions from "../interfaces/IOptions";
import IWalOptions from "../interfaces/IWalOptions";
import Timeout = NodeJS.Timeout;

export default class ChangeListener extends EventEmitter {
    private static readonly DEFAULT_TIMEOUT = Number(process.env.DEFAULT_TIMEOUT) || 10 * 1000; // 10 s
    private readonly _slotName: string | undefined;
    private readonly _walOptions: IWalOptions;
    private readonly _createIfNotExists: boolean;
    private readonly _readQuery: IQuery;
    private readonly _timeout: any;
    private _waiting: boolean = false;
    private _currentTimeout: Timeout;
    private _db: Client;
    private _running: boolean = false;

    constructor(db: Client, options: IOptions = {}, walOptions: IWalOptions = {}) {
        super();

        const {slotName, timeout, createIfNotExists} = options;
        this._slotName = slotName;
        this._timeout = timeout;
        if (timeout == null) {
            this._timeout = ChangeListener.DEFAULT_TIMEOUT;
        }
        this._createIfNotExists = createIfNotExists || false;

        this._db = db;
        this._walOptions = walOptions;
        this._readQuery = this.getSlotChangesQuery();
    }

    public async start(): Promise<void> {
        if (this._running) {
            this.error("This listener is already running. " +
                "If you would like to restart it, use the restart method.");
            return;
        }
        this._waiting = false;
        this._running = true;
        try {
            await this.initReplicationSlot();
            await this.next();
        } catch (e) {
            this.error(e);
        }
    }

    public async next(): Promise<void> {
        if (!this._running) {
            this.error("Please start the listener before requesting changes.");
        } else if (this._waiting) {
            this.error("You are trying to read new changes while the previous changes are still being processed.");
        } else {
            this._waiting = true;
            this._currentTimeout = setTimeout(() => {
                this.readChanges();
            }, this._timeout);
        }
    }

    public async initReplicationSlot(): Promise<void> {
        const results = await this._db.query(`
            SELECT
            FROM pg_replication_slots
            WHERE slot_name = $1;
        `, [this._slotName]);

        const slotExists: boolean = !!results.rows.length;

        if (!slotExists) {
            await this._db.query(
                "SELECT pg_catalog.pg_create_logical_replication_slot($1,'wal2json');",
                [this._slotName]
            );
        } else if (this._createIfNotExists) {
            throw new Error("A replication slot with this name already exists.");
        }
    }

    private getSlotChangesQuery(): IQuery {
        const changesSql: string[] = [];
        for (const option in this._walOptions) {
            // @ts-ignore
            const value: string = String(this._walOptions[option]);
            changesSql.push(option);
            changesSql.push(value);
        }

        return {
            text: `
                SELECT data
                FROM pg_catalog.pg_logical_slot_get_changes(
                    $1::TEXT,
                    NULL::PG_LSN,
                    NULL:: INTEGER,
                    VARIADIC $2::TEXT[]
                    )
            `,
            values: [this._slotName, `{${changesSql.join(",")}}`]
        };
    }

    private async readChanges(): Promise<void> {
        try {
            const results = await this._db.query(this._readQuery);
            this._waiting = false;
            if (results.rows.length > 0) {
                this.emit("changes", results.rows);
            } else {
                await this.next();
            }
        } catch (err) {
            this.stop(err);
        }
    }

    private error(err: string): void {
        this.emit("error", err);
        this.close().then();
    }

    private async close(): Promise<boolean> {
        await this._db.end();
        this._running = false;
        this.emit("stop", true);
        return true;
    }

    private stop(err: Error): void {
        clearTimeout(this._currentTimeout);
        this.error(err.message);
    }
}
