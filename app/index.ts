/* istanbul ignore file */
import dotenv from "dotenv";
import WalLogger from "./classes/WalLogger";
import {Client, ClientConfig} from "pg";
import IOptions from "./interfaces/IOptions";
import IWalOptions from "./interfaces/IWalOptions";
import ChangeListener from "./classes/ChangeListener";
import PgWriter from "./classes/DbWriter/PgWriter";
import PKeysCache from "./classes/PKeysCache";
import {Server} from "./api/Server";

(async () => {
    // Load environment variables
    dotenv.config();

    /**
     * Set up params.
     * masterDbConf - for connection to parent database
     * changeListenerOptions - for change listener class
     * walOptions - for wal2json PostgreSQL logical decoding plugin.
     */
    const masterDbConf: ClientConfig = {
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD,
        database: process.env.MASTER_DB_NAME,
        host: process.env.MASTER_DB_HOST,
        port: Number(process.env.MASTER_DB_PORT)
    };

    const slaveDbConf: ClientConfig = {
        user: process.env.SLAVE_DB_USER,
        password: process.env.SLAVE_DB_PASSWORD,
        database: process.env.SLAVE_DB_NAME,
        host: process.env.SLAVE_DB_HOST,
        port: Number(process.env.SLAVE_DB_PORT)
    };

    const changeListenerOptions: IOptions = {
        slotName: process.env.REPLICATION_SLOT_NAME,
        timeout: Number(process.env.CHANGES_FETCH_TIMEOUT)
    };

    const walOptions: IWalOptions = {
        // transaction ID
        "include-xids": 1,
        "filter-tables": process.env.FILTER_TABLES // comma-separated
    };

    try {
        const db: Client = new Client(masterDbConf);
        await db.connect();
        const slaveDb = new Client(slaveDbConf);
        await slaveDb.connect();
        const server = new Server(slaveDb);
        server.initRoutes();
        const changeListener: ChangeListener = new ChangeListener(
            db,
            changeListenerOptions,
            walOptions
        );
        const dbWriter: PgWriter = new PgWriter(slaveDb);
        const pKeysCache: PKeysCache = new PKeysCache(db);
        await pKeysCache.init();
        const walLogger: WalLogger = new WalLogger(changeListener, dbWriter, pKeysCache);
        await walLogger.start();
    } catch (e) {
        console.error(e.message);
        process.exit(-1);
    }
})();
