import PgWriter from "../app/classes/DbWriter/PgWriter";
import sinon from "sinon";
import assert from "assert";
import {Client} from "pg";
import Message from "../app/classes/Message";
import IWal2JsonEvent from "../app/interfaces/IWal2JsonEvent";

describe("PgWriter", () => {
    describe("connect", () => {
        it("should call pg.Client.connect() method", () => {
            // Arrange
            const spy = sinon.spy();
            const postgresWriter = new PgWriter();
            const client = postgresWriter.client;
            sinon.stub(client, "connect").callsFake(() => {
                spy();
            });
            // Act
            postgresWriter.connect().then(() => {
                // Assert
                assert(spy.called,
                    "postgresWriter connection should create pg.Client's connection");
            });
        });
    });

    describe("saveMessage", () => {
        it("should insert in database", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            const fromClient = new Client();
            sinon.stub(fromClient, "query").callsFake(() => {
                return {};
            });
            const spy = sinon.spy();
            const testEvent: IWal2JsonEvent = {
                kind: "insert",
                schema: "test",
                table: "test",
                columnnames: ["some"],
                columntypes: ["some"],
                columnvalues: ["some"],
                oldkeys: {
                    keynames: ["some"],
                    keytypes: ["some"],
                    keyvalues: ["some"]
                }
            };
            const message = new Message(testEvent);
            message.diff = {
                deleted: {
                    oldValue: 0,
                    newValue: 1
                }
            };
            const postgresWriter = new PgWriter();
            const toClient = postgresWriter.client;
            sinon.stub(toClient, "connect").resolves();
            sinon.stub(toClient, "query").callsFake((query) => {
                const regex = new RegExp(/.*insert\s+into\s+log.*/i);
                if (regex.test(query)) {
                    spy();
                }
            });
            // Act
            postgresWriter.saveMessage(message);
            // Assert
            assert(spy.called, "saveMessage should execute insert query");
        });
    });
});
