import IStrDict from "./IStrDict";

export default interface IChange extends IStrDict<{ value: string, type: string }> {
}
