export default interface IWal2JsonEvent {
    kind: "insert" | "update" | "delete";
    schema: string;
    table: string;
    columnnames: string[];
    columntypes: string[];
    columnvalues: string[];
    oldkeys: {
        keynames: string[];
        keytypes: string[];
        keyvalues: string[];
    };
    pkColumns?: string[];
}
