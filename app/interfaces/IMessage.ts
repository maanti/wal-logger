import IDiff from "./IDiff";

export default interface IMessage {
    type: "insert" | "update" | "delete";
    schema: string;
    table: string;
    // pk: ;
    // user: ;
    diff: IDiff;
}
