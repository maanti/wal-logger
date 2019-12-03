import {EventEmitter} from "events";
import * as pg from "pg";
import Timeout = NodeJS.Timeout;

export default class ChangeListener extends EventEmitter {
    /**
     * Frequency of database polling is slowly decreasing by
     * TIMEOUT_INCREASE_STE every MAX_THROTTLE_ITERATIONS
     * till timeout duration is less than MAX_TIMEOUT.
     *
     * When data change is captured, timeout is set to DEFAULT_TIMEOUT
     */
    private static readonly MAX_THROTTLE_ITERATIONS: number = Number(process.env.MAX_THROTTLE_ITERATIONS) || 5;
    private static readonly TIMEOUT_INCREASE_STEP = Number(process.env.TIMEOUT_INCREASE_STEP) || 5 * 1000; // 5 s
    private static readonly DEFAULT_TIMEOUT = Number(process.env.DEFAULT_TIMEOUT) || 10 * 1000; // 10 s
    private static readonly MAX_TIMEOUT = Number(process.env.MAX_TIMEOUT) || 30 * 1000; // 30 s

    private readonly slotName: string;
    private readonly walOptions: IWal2jsonOptions;
    private readonly createIfNotExists: boolean;
    private readonly readQuery: IReadQuery;
    private timeout: any;
    private waiting: boolean = false;
    private currentTimeout: Timeout | null = null;
    private client: pg.Client;
    private running: boolean = false;
    private throttleCounter: number;

    constructor(client: pg.Client, options: IOptions, walOptions: IWal2jsonOptions = {}) {
        super();

        this.throttleCounter = 0;

        const {slotName, timeout, createIfNotExists} = options;
        this.slotName = slotName || "walog_slot";
        this.timeout = timeout;
        this.createIfNotExists = createIfNotExists || false;

        this.client = client;
        this.walOptions = walOptions;
        this.readQuery = this.getSlotChangesQuery();
    }

    public async start(): Promise<void> {
        await this.client.connect();
        if (this.running) {
            await this.error("This listener is already running. " +
                "If you would like to restart it, use the restart method.");
            return;
        }
        this.waiting = false;
        this.running = true;
        try {
            await this.initReplicationSlot();
            this.next();
        } catch (e) {
            await this.error(e);
        }
    }

    public next(): void {
        if (!this.running) {
            this.error("Please start the listener before requesting changes.");
        } else if (this.waiting) {
            this.error("You are trying to read new changes while the previous changes are still being processed.");
        } else if (!this.client) {
            this.error("This listener doesn't have a valid open client, to add one run restart(client).");
        } else if (this.timeout) {
            this.waiting = true;
            this.currentTimeout = setTimeout(() => {
                this.readChanges();
            }, this.timeout);
        } else {
            this.waiting = true;
            this.readChanges();
        }
    }

    private getSlotChangesQuery(): IReadQuery {
        const changesSql: string[] = [];
        for (const option in this.walOptions) {
            if (!this.walOptions.hasOwnProperty(option)) {
                continue;
            }
            // @ts-ignore
            const value: string = String(walOptions[option]);
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
            values: [this.slotName, `{${changesSql.join(",")}}`]
        };
    }

    private async initReplicationSlot(): Promise<void> {
        const results = await this.client.query(`
            SELECT
            FROM pg_replication_slots
            WHERE slot_name = $1;
        `, [this.slotName]);

        const slotExists: boolean = !!results.rows.length;

        if (!slotExists) {
            await this.client.query(
                "SELECT pg_catalog.pg_create_logical_replication_slot($1,'wal2json');",
                [this.slotName]
            );
        } else if (this.createIfNotExists) {
            throw new Error("A replication slot with this name already exists.");
        }
    }

    private increaseTimeout(): void {
        if (this.timeout < ChangeListener.MAX_TIMEOUT) {
            this.timeout += ChangeListener.TIMEOUT_INCREASE_STEP;
            if (this.timeout > ChangeListener.MAX_TIMEOUT) {
                this.timeout = ChangeListener.MAX_TIMEOUT;
            }
        }
    }

    private resetTimeout() {
        this.timeout = ChangeListener.DEFAULT_TIMEOUT;
    }

    private readChanges(): void {
        this.client.query(this.readQuery,
            (err, results) => {
                if (err) {
                    this.stop(err);
                    throw (err);
                }
                this.waiting = false;
                if (results.rows.length > 0) {
                    this.throttleCounter = 0;
                    this.resetTimeout();
                    this.emit("changes", results.rows);
                } else {
                    if (this.throttleCounter >= ChangeListener.MAX_THROTTLE_ITERATIONS) {
                        this.increaseTimeout();
                        this.throttleCounter = 0;
                    } else {
                        this.throttleCounter++;
                    }
                    this.next();
                }
            });
    }

    private error(err: string): void {
        this.close().then(() => {
            this.emit("error", err);
        });
    }

    private async close(): Promise<boolean> {
        await this.client.end();
        this.running = false;
        this.emit("stop", true);
        return true;
    }

    private async restart(client: pg.Client): Promise<void> {
        if (this.running) {
            await this.close();
        }
        this.client = client;
        this.client.connect().then(() => {
            this.start();
        }).catch((err) => {
            this.error(err.message);
        });
    }

    private stop(err: Error): void {
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }
        if (this.running) {
            this.error(err.message);
        }
    }
}
