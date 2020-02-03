import WalLogger from "../app/classes/WalLogger";
import assert from "assert";
import {Client, ClientConfig} from "pg";
import ChangeListener from "../app/classes/ChangeListener";
import PgWriter from "../app/classes/DbWriter/PgWriter";
import PKeysCache from "../app/classes/PKeysCache";
import sinon from "sinon";
import DbWriter from "../app/classes/DbWriter/DbWriter";

describe("WalLogger", () => {
    let db: Client;
    let changeListener: ChangeListener;
    let dbWriter: DbWriter;
    let pKeysCache: PKeysCache;
    const config: ClientConfig = {
        user: "test",
        password: "test",
        database: "test",
        host: "test",
        port: 5432
    };

    beforeEach(async () => {
        db = new Client();
        sinon.stub(db, "connect").resolves();
        sinon.stub(db, "query").callsFake(() => {
            return {
                rows: [
                    {
                        schema: "schema",
                        table: "table",
                        pk: "id"
                    }
                ]
            };
        });
        changeListener = new ChangeListener(
            db
        );
        sinon.stub(changeListener, "next").resolves();
        dbWriter = new PgWriter(config);
        sinon.stub(dbWriter, "connect").resolves();
        pKeysCache = new PKeysCache(db);
        await pKeysCache.init();
    });

    describe("start", () => {
        it("without errors", async () => {
            const walLogger = new WalLogger(changeListener, dbWriter, pKeysCache);
            assert.doesNotThrow(async () => {
                await walLogger.start();
            }, "should start without errors");
        });
    });

    describe("onChange", () => {
        it("changes emitted", async () => {
            // Arrange
            const walLogger = new WalLogger(changeListener, dbWriter, pKeysCache);
            const spy = sinon.spy();
            sinon.stub(dbWriter, "saveMessage").callsFake(() => {
                spy();
            });
            await walLogger.start();
            // Act
            changeListener.emit("changes", [
                {
                    data: `{
                        "xid":203372,
                        "change":
                            [
                                {
                                    "kind":"update",
                                    "schema":"public",
                                    "table":"some",
                                    "columnnames":["id","login"],
                                    "columntypes":["bigint","character varying(128)"],
                                    "columnvalues":[620,"economist"],
                                    "oldkeys":{
                                        "keynames":["id","login"],
                                        "keytypes":["bigint","character varying(128)"],
                                        "keyvalues":[3,"driver"]
                                    }
                                }
                            ]
                    }`
                }
            ]);
            // Assert
            assert(spy.called, "should saveMessage on 'changes' event");
        });
    });
});
