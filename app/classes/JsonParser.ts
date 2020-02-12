import IChange from "../interfaces/IChange";
import IDiff from "../interfaces/IDiff";
import IStrDict from "../interfaces/IStrDict";

export default class JsonParser {
    public buildObject(names: string[], values: any[], types: string[]): IChange {
        const areArraysSameLength: boolean = names.length === values.length && values.length === types.length;

        if (!areArraysSameLength) {
            throw new Error("Arrays of different size passed");
        }

        const obj: IChange = {};
        for (let i = 0, len = names.length; i < len; i++) {
            obj[names[i]] = {
                value: values[i],
                type: types[i]
            };
        }
        return obj;
    }

    public getDiffObject(oldObj: IChange, newObj: IChange): IDiff {
        const diffObj: IDiff = {};
        for (const column in newObj) {
            const oldValue = oldObj[column] && oldObj[column].value;
            const newValue = newObj[column].value;
            // tslint:disable-next-line:triple-equals
            if (oldValue != newValue) {
                diffObj[column] = {
                    oldValue,
                    newValue
                };
            }
        }

        return diffObj;
    }

    public buildPKeys(obj: IChange, columns: string[] = []): IStrDict<string | number> {
        const pKey: IStrDict<string | number> = {};
        for (const column of columns) {
            pKey[column] = obj[column].value;
        }
        return pKey;
    }
}
