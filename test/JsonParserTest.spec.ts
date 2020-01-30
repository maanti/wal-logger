import assert from "assert";
import JsonParser from "../app/classes/JsonParser";
import IChange from "../app/interfaces/IChange";
import IDiff from "../app/interfaces/IDiff";
import IStrDict from "../app/interfaces/IStrDict";

describe("JsonParser", () => {
    let jsonParser: JsonParser;

    beforeEach(() => {
        jsonParser = new JsonParser();
    });

    describe("buildObject", () => {
        let names: string[];
        let values: any[];
        let types: string[];

        beforeEach(() => {
            names = [
                "id",
                "login",
                "deleted"
            ];

            values = [
                620,
                "user",
                1
            ];

            types = [
                "bigint",
                "character varying(128)",
                "smallint"
            ];
        });

        it("of three equal-size arrays", () => {
            // Arrange
            const expectedObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "user",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "1",
                    type: "smallint"
                }
            };
            // Act
            const actualObj: IChange = jsonParser.buildObject(names, values, types);
            // Assert
            assert.deepEqual(expectedObj, actualObj,
                "Three arrays should be combined in one object with keys - columns " +
                "and values - {value: string, type: string}");
        });

        it("of empty arrays", () => {
            // Arrange
            const expectedObj: IChange = {};
            // Act
            const actualObj: IChange = jsonParser.buildObject([], [], []);
            // Assert
            assert.deepEqual(expectedObj, actualObj);
        });

        describe("of different size arrays", () => {
            it("values array has more elements than names arrays", () => {
                // Arrange
                values = [
                    620,
                    "user",
                    1,
                    3
                ];
                // Assert
                assert.throws(
                    () => {
                        // Act
                        jsonParser.buildObject(names, values, types);
                    },
                    () => {
                        return true;
                    },
                    "unexpected error");
            });

            it("values array has fewer elements than names arrays", () => {
                // Arrange
                values = [
                    620,
                    "user"
                ];
                // Assert
                assert.throws(
                    () => {
                        // Act
                        jsonParser.buildObject(names, values, types);
                    },
                    () => {
                        return true;
                    },
                    "unexpected error");
            });

        });
    });


    describe("getDiffObject", () => {
        it("two object with no different properties", () => {
            // Arrange
            const obj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                }
            };
            // Act
            const actualObj: IDiff = jsonParser.getDiffObject(obj, obj);
            // Assert
            assert.deepEqual(
                actualObj,
                {},
                "Should return empty object if no different properties"
            );
        });

        it("two object with one different property", () => {
            // Arrange
            const oldObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "0",
                    type: "smallint"
                }
            };
            const newObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "1",
                    type: "smallint"
                }
            };

            const expectedObj: IDiff = {
                deleted: {
                    oldValue: 0,
                    newValue: 1
                }
            };
            // Act
            const actualObj: IDiff = jsonParser.getDiffObject(oldObj, newObj);
            // Assert
            assert.deepEqual(
                actualObj,
                expectedObj,
                "Diff object includes all property-value pairs that has different values"
            );
        });

        it("two object with two different properties", () => {
            // Arrange
            const oldObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "0",
                    type: "smallint"
                }
            };
            const newObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "ceo",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "1",
                    type: "smallint"
                }
            };

            const expectedObj: IDiff = {
                deleted: {
                    oldValue: 0,
                    newValue: 1
                },
                login: {
                    oldValue: "economist",
                    newValue: "ceo"
                }
            };
            // Act
            const actualObj = jsonParser.getDiffObject(oldObj, newObj);
            // Assert
            assert.deepEqual(
                actualObj,
                expectedObj,
                "Diff object includes all property-value pairs that has different values"
            );
        });

        it("new column in newObj", () => {
            // Arrange
            const oldObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                }
            };
            const newObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                },
                deleted: {
                    value: "0",
                    type: "smallint"
                }
            };

            const expectedObj: IDiff = {
                deleted: {
                    oldValue: "",
                    newValue: 0
                }
            };
            // Act
            const actualObj: IDiff = jsonParser.getDiffObject(oldObj, newObj);
            // Assert
            assert.deepEqual(
                actualObj,
                expectedObj,
                "If value wasn't found in the old object it is set to empty string"
            );
        });
    });


    describe("build PKeys object", () => {
        it("", () => {
            // Arrange
            const oldObj: IChange = {
                id: {
                    value: "620",
                    type: "bigint"
                },
                login: {
                    value: "economist",
                    type: "character varying(128)"
                }
            };
            const pKeyColumns = ["id"];
            // Act
            const result: IStrDict<string | number> = jsonParser.buildPKeys(oldObj, pKeyColumns);
            // Assert
            assert.deepEqual(result, {
                id: 620
            });
        });
    });
});
