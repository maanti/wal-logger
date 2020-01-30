/* istanbul ignore file */
import WalLogger from "./classes/WalLogger";
import {Client} from "pg";
import IDbConf from "./interfaces/IDbConf";
import IOptions from "./interfaces/IOptions";
import IWalOptions from "./interfaces/IWalOptions";
import ChangeListener from "./classes/ChangeListener";
import PgWriter from "./classes/DbWriter/PgWriter";
import PKeysCache from "./classes/PKeysCache";


// TODO: API на вход получает имя таблицы и массив ID или диапазон дат
(async () => {
    /**
     * Set up params.
     * dbConfig - for connection to parent database
     * options - for change listener class
     * walOptions - for wal2json PostgeSQL logical decoding plugin
     */
    const dbConfig: IDbConf = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT)
    };

    const options: IOptions = {
        slotName: process.env.SLOT_NAME,
        timeout: Number(process.env.TIMEOUT_MS) || 500
    };

    const walOptions: IWalOptions = {
        // transaction ID
        "include-xids": 1
    };

    try {
        const db = new Client(dbConfig);
        await db.connect();
        const changeListener = new ChangeListener(
            db,
            options,
            walOptions
        );
        const dbWriter = new PgWriter();
        const pKeysCache = new PKeysCache(db);
        await pKeysCache.init();
        const walLogger = new WalLogger(changeListener, dbWriter, pKeysCache);
        await walLogger.start();
    } catch (e) {
        console.error(e.message);
        process.exit(-1);
    }
})();
