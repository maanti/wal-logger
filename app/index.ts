import WalLogger from "./classes/WalLogger";

(async () => {
    /**
     * Set up params.
     * dbConfig - for connection to parent database
     * options - for change listener class
     * walOptions - for wal2json PostgeSQL logical decoding plugin
     */
    const dbConfig: IDbConfig = {
        user: `${process.env.DB_USER}`,
        password: `${process.env.DB_PASSWORD}`,
        database: `${process.env.DB_NAME}`,
        port: Number(process.env.DB_PORT)
    };

    const options: IOptions = {
        slotName: "walog_slot",
        timeout: 500
    };

    const walOptions: IWal2jsonOptions = {
        // "include-type-oids": 1,
        // "include-types": 1
    };

    try {
        const walLogger = new WalLogger(dbConfig, options, walOptions);
        await walLogger.start();
    } catch (e) {
        console.error(e.message);
        process.exit(-1);
    }
})();
