/* istanbul ignore file */
import dotenv from "dotenv";
import WalLogger from "./classes/WalLogger";
import {Client, ClientConfig} from "pg";
import IDbConf from "./interfaces/IDbConf";
import IOptions from "./interfaces/IOptions";
import IWalOptions from "./interfaces/IWalOptions";
import ChangeListener from "./classes/ChangeListener";
import PgWriter from "./classes/DbWriter/PgWriter";
import PKeysCache from "./classes/PKeysCache";

// TODO: API на вход получает имя таблицы и массив ID или диапазон дат
(async () => {
    // Load environment variables
    dotenv.config();

    /**
     * Set up params.
     * masterDbConf - for connection to parent database
     * changeListenerOptions - for change listener class
     * walOptions - for wal2json PostgreSQL logical decoding plugin.
     */
    const masterDbConf: IDbConf = {
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD,
        database: process.env.MASTER_DB_NAME,
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
        "include-xids": 1
    };

    try {
        const db = new Client(masterDbConf);
        await db.connect();
        const changeListener = new ChangeListener(
            db,
            changeListenerOptions,
            walOptions
        );
        const dbWriter = new PgWriter(slaveDbConf);
        const pKeysCache = new PKeysCache(db);
        await pKeysCache.init();
        const walLogger = new WalLogger(changeListener, dbWriter, pKeysCache);
        await walLogger.start();
    } catch (e) {
        console.error(e.message);
        process.exit(-1);
    }
})();
