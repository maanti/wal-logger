import IStrDict from "./IStrDict";

export default interface IDiff extends IStrDict<{
    oldValue: string | number | undefined,
    newValue: string | number | undefined
}> {
}
