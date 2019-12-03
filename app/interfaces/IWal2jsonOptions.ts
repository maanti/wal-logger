// 0 | 1 — C-style boolean representation (wal2json is written in C)
interface IWal2jsonOptions {
    "include-xids"?: 0 | 1;
    "include-timestamp"?: 0 | 1;
    "include-schemas"?: 0 | 1;
    "include-types"?: 0 | 1;
    "include-typmod"?: 0 | 1;
    "include-type-oids"?: 0 | 1;
    "pretty-print"?: 0 | 1;
    "write-in-chunks"?: 0 | 1;
    "include-lsn"?: 0 | 1;
    "filter-tables"?: string;
    "add-tables"?: string;
    "format-version"?: number;
}
