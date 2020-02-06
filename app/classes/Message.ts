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
    private oldObj: IChange;
    private newObj: IChange;
    private jsonParser: JsonParser;

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
        this.jsonParser = new JsonParser();
        switch (this.type) {
            case "insert":
                this.createInsertMessage(walEvent);
                break;
            case "update":
                this.createUpdateMessage(walEvent);
                break;
            case "delete":
            // this.createDeleteMessage(walEvent);
        }

    }

    private createInsertMessage(walEvent: IWal2JsonEvent) {
        const {
            columnnames,
            columntypes,
            columnvalues,
            pkColumns
        } = walEvent;
        this.newObj = this.jsonParser.buildObject(columnnames, columnvalues, columntypes);
        this.diff = this.jsonParser.getDiffObject({}, this.newObj);
        this.pKey = this.jsonParser.buildPKeys(this.newObj, pkColumns);
    }

    private createUpdateMessage(walEvent: IWal2JsonEvent) {
        const {
            columnnames,
            columntypes,
            columnvalues,
            pkColumns,
            oldkeys
        } = walEvent;
        this.newObj = this.jsonParser.buildObject(columnnames, columnvalues, columntypes);
        const {
            keynames,
            keytypes,
            keyvalues
        } = oldkeys;
        this.oldObj = this.jsonParser.buildObject(keynames, keyvalues, keytypes);
        this.diff = this.jsonParser.getDiffObject(this.oldObj, this.newObj);
        this.pKey = this.jsonParser.buildPKeys(this.oldObj, pkColumns);
    }

    // private createDeleteMessage(walEvent) {
    //     const {
    //         pkColumns,
    //         oldkeys
    //     } = walEvent;
    //     const {
    //         keynames,
    //         keytypes,
    //         keyvalues
    //     } = oldkeys;
    //     this.oldObj = this.jsonParser.buildObject(keynames, keyvalues, keytypes);
    //     this.diff = this.jsonParser.getDiffObject(this.oldObj, this.newObj);
    //     this.pKey = this.jsonParser.buildPKeys(this.oldObj, pkColumns);
    // }
}
