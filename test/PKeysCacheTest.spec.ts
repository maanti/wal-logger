import PKeysCache from "../app/classes/PKeysCache";
import assert from "assert";
import sinon from "sinon";
import {Client} from "pg";
import NodeCache = require("node-cache");

describe("PKeysCache", () => {
    let db: Client;
    let rows: any[];
    beforeEach(() => {
        db = new Client();
        sinon.stub(db, "connect").resolves();
        rows = [{schema: "schema", table: "table", pk: "{id_one, id_two}"}];
        sinon.stub(db, "query").callsFake(() => {
            return {
                rows
            };
        });
    });

    describe("init", () => {
        it("handle table with null primary key", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            rows = [{table: "table", schema: "schema", pk: null}];

            // Assert
            assert.doesNotThrow(async () => {
                // Act
                await cache.init();
            }, "table without pk should be ignored");
        });

        it("handle table with no primary key", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            rows = [{table: "table", schema: "schema", pk: "{}"}];

            // Assert
            assert.doesNotThrow(async () => {
                // Act
                await cache.init();
            }, "table without pk should be ignored");
        });
    });

    describe("Get", () => {
        it("getter", () => {
            // Arrange
            const cache = new PKeysCache(db);
            // Act
            const nodeCache = cache.cache;
            // Assert
            assert(nodeCache instanceof NodeCache,
                "PKeysCache class should return NodeCache instance with getter method");
        });
        it("get from empty cache", () => {
            // Arrange
            const cache = new PKeysCache(db);
            // Act
            const result = cache.get("test");
            // Assert
            assert(result === undefined, "Should return undefined when no value in cache");
        });

        it("get cached data", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            await cache.init();

            // Act
            const result = cache.get("schema.table");

            // Assert
            assert.deepEqual(result, ["id_one", "id_two"]);
        });
    });


    describe("delete", () => {
        it("cache.del should delete cached value", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            await cache.init();

            // Act
            cache.del("schema.table");
            const result = cache.get("schema.table");

            // Assert
            assert(result === undefined,
                "cache.del should delete cached value");
        });

        it("cache.del not-existing key", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            await cache.init();

            // Assert
            assert.doesNotThrow(() => {
                // Act
                cache.del("no-such-key");
            }, "deleting not-existing key should pass without errors");
        });
    });


    describe("flush", () => {
        it("flush all records", async () => {
            // Arrange
            const cache = new PKeysCache(db);
            await cache.init();

            // Act
            cache.flush();

            // Assert
            const result = cache.get("schema.table");
            assert(result === undefined,
                "flush should delete all cache records");
        });
    });
});

