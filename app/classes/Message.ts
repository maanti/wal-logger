import IMessage from "../interfaces/IMessage";
import IDiff from "../interfaces/IDiff";
import IStrDict from "../interfaces/IStrDict";
import IWal2JsonEvent from "../interfaces/IWal2JsonEvent";
import JsonParser from "./JsonParser";
import IChange from "../interfaces/IChange";

export default class Message implements IMessage {

    public diff: IDiff;
    public schema: string;
    public table: string;
    public type: "insert" | "update" | "delete";
    public pKey: IStrDict<string | number>;
    private readonly oldObj: IChange;
    private readonly newObj: IChange;

    constructor(walEvent: IWal2JsonEvent) {
        const {
            columnnames,
            columntypes,
            columnvalues,
            oldkeys,
            kind,
            schema,
            table,
            pkColumns
        } = walEvent;
        this.schema = schema;
        this.table = table;
        this.type = kind;
        const jsonParser = new JsonParser();
        this.newObj = jsonParser.buildObject(columnnames, columnvalues, columntypes);
        const {
            keynames,
            keytypes,
            keyvalues
        } = oldkeys;
        this.oldObj = jsonParser.buildObject(keynames, keyvalues, keytypes);
        this.diff = jsonParser.getDiffObject(this.oldObj, this.newObj);
        this.pKey = jsonParser.buildPKeys(this.oldObj, pkColumns);
    }
}
