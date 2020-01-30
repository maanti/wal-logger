import NodeCache, {Key} from "node-cache";
import {Client} from "pg";

interface ICacheParams {
    stdTTL: number;
    checkperiod: number;
    useClones: boolean;
}

export default class PKeysCache {
    private readonly _cache: NodeCache;
    private readonly _db: Client;

    /**
     * Creates an instance of PKeysCache class
     * @param db pg.Client object.
     * @param ttlSeconds standard time to live for cached key:value pair.
     */
    constructor(db: Client, ttlSeconds: number = 0) {
        const cacheParams: ICacheParams = {
            stdTTL: ttlSeconds,
            // time in seconds to check all data and delete expired keys
            checkperiod: ttlSeconds * 0.2,
            useClones: false
        };
        this._cache = new NodeCache(cacheParams);
        this._db = db;
    }

    get cache() {
        return this._cache;
    }

    public get(key: Key): any {
        return this._cache.get(key);
    }

    public del(keys: Key | Key[]): void {
        this._cache.del(keys);
    }

    public flush(): void {
        this._cache.flushAll();
    }

    public async init(): Promise<void> {
        const allTablesPKeyQuery = `
            SELECT tc.table_schema AS schema,
                tc.table_name AS "table",
                array_agg(kc.column_name) AS pk
            FROM information_schema.table_constraints tc
                     JOIN information_schema.key_column_usage kc
                          ON kc.table_name = tc.table_name
                              AND kc.table_schema = tc.table_schema
                              AND kc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
              AND kc.ordinal_position IS NOT NULL
            GROUP BY tc.table_schema, tc.table_name;
        `;

        const result = await this._db.query(allTablesPKeyQuery);
        let columns;
        for (const row of result.rows) {
            const {schema, table, pk} = row;
            if (pk) {
                columns = pk.match(/[\w.-]+/g);
                if (columns) {
                    columns = columns.map(String);
                }
                this._cache.set(`${schema}.${table}`, columns);
            }
        }
    }
}
