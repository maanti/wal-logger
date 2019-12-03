import ChangeListener from "./ChangeListener";
import * as pg from "pg";
import DbWriter from "./DbWriter/DbWriter";
import PostgresWriter from "./DbWriter/PostgresWriter";

/**
 * Main class.
 * Logging changes in parent app's database and store them.
 */
export default class WalLogger {

    /**
     * Checks if all params are passed
     * @param config object of IDbConfig interface
     */
    private static validateDbConfig(config: IDbConfig) {
        if (!config.user) {
            throw new Error("DB_USER env variable isn't set");
        } else if (!config.password) {
            throw new Error("DB_PASSWORD env variable isn't set");
        } else if (!config.database) {
            throw new Error("DB_NAME env variable isn't set");
        }
        return true;
    }

    private readonly dbConfig: IDbConfig;
    private readonly options: IOptions;
    private readonly wal2sonOptions: IWal2jsonOptions;
    private dbWriter: DbWriter;

    constructor(
        dbConfig: IDbConfig,
        options: IOptions,
        wal2jsonOptions: IWal2jsonOptions
    ) {
        WalLogger.validateDbConfig(dbConfig);
        this.dbConfig = dbConfig;
        this.options = options;
        this.wal2sonOptions = wal2jsonOptions;
    }

    /**
     * Entry point. Starts data change listener.
     */
    public async start() {
        const changeListener = new ChangeListener(
            new pg.Client(this.dbConfig),
            this.options,
            this.wal2sonOptions
        );

        changeListener.on("changes", async (changes) => {
            await this.onChange(changes);
            console.log(JSON.stringify(changes));
            changeListener.next();
        });

        changeListener.on("error", (err) => {
            console.log("err: ", err);
        });

        await this.initDbWriter();
        await changeListener.start();
    }

    private async onChange(changes: any[]) {
        let changesData: any[] = changes.map((change: any) => change.data);
        for (const changeData of changesData) {
            changesData = JSON.parse(changeData);
            await this.dbWriter.writeRow(changesData);
        }
    }

    private async initDbWriter() {
        this.dbWriter = new PostgresWriter();
        await this.dbWriter.connect();
    }
}
