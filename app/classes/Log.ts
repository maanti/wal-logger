import {IRequestData} from "../interfaces/IRequestData";

import {Client} from "pg";

export {Log};

class Log {
    private _client: Client;

    constructor(client: Client) {
        this._client = client;
    }

    public async getData(reqData: IRequestData): Promise<any[]> {
        const {date, ids, table, sort} = reqData;
        const {rows} = await this._client.query(`
            SELECT *
            FROM log
            WHERE (
                    $1::BIGINT[] IS NULL
                    OR (pkey ->> 'id')::BIGINT = ANY ($1::BIGINT[])
                )
              AND (
                    $2::TEXT IS NULL
                    OR lower(table_name) = lower($2::TEXT)
                )
              AND (
                    $3::TIMESTAMP WITHOUT TIME ZONE IS NULL OR $4::TIMESTAMP WITHOUT TIME ZONE IS NULL
                    OR dt_create BETWEEN $3::TIMESTAMP WITHOUT TIME ZONE
                        AND $4::TIMESTAMP WITHOUT TIME ZONE
                )
            ORDER BY (CASE WHEN $6 = 'ASC' THEN $5 END),
                (CASE WHEN $6 = 'DESC' THEN $5 END) DESC;
        `, [
            ids,
            table,
            date && date.from || null,
            date && date.to || null,
            sort && sort.column || "id",
            sort && sort.direction || "asc"
        ]);

        return rows;
    }
}
