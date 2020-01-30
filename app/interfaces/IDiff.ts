import IStrDict from "./IStrDict";

export default interface IDiff extends IStrDict<{
    oldValue: string | number,
    newValue: string | number
}> {
}
