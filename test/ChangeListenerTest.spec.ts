import assert from "assert";
import {Client} from "pg";
import sinon from "sinon";
import ChangeListener from "../app/classes/ChangeListener";

describe("ChangeListener", () => {
    describe("start", () => {
        it("starts without errors", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            const changeListener = new ChangeListener(
                client,
                {timeout: 0}
            );
            const errorSpy = sinon.spy();
            sinon.stub(changeListener, "initReplicationSlot").resolves();

            changeListener.on("error", () => {
                errorSpy();
            });
            // Act
            await changeListener.start();
            // Assert
            assert(!errorSpy.called, "error occurred on listener start up");
        });

        it("should produce error when starting twice", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            const changeListener = new ChangeListener(
                client,
                {timeout: 1}
            );
            const errorSpy = sinon.spy();
            sinon.stub(changeListener, "initReplicationSlot").resolves();

            changeListener.on("error", () => {
                errorSpy();
            });
            // Act
            await changeListener.start();
            await changeListener.start();
            // Assert
            assert(errorSpy.called, "should produce error when starting twice");
        });

        it("should emit error event when initReplicationSlop rejects", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            const changeListener = new ChangeListener(
                client,
                {slotName: "test"},
                {"include-xids": 1}
            );
            const errorSpy = sinon.spy();
            sinon.stub(changeListener, "initReplicationSlot").rejects();

            changeListener.on("error", () => {
                errorSpy();
            });
            // Act
            await changeListener.start();
            // Assert
            assert(errorSpy.called, "should produce error when initReplicationSlop rejects");
        });
    });

    describe("initializes replication slot", () => {
        it("slot exists, createIfNotExists is true", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            sinon.stub(client, "query").callsFake(() => {
                return {
                    rows: [{some: 1}, {rows: 2}]
                };
            });
            const changeListener = new ChangeListener(
                client,
                {slotName: "test", createIfNotExists: true},
                {}
            );
            // Assert
            await assert.rejects(async () => {
                // Act
                await changeListener.initReplicationSlot();
            }, Error);
        });

        it("slot doesn't exist", async () => {
            // Arrange
            const client = new Client();
            const spy = sinon.spy();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            sinon.stub(client, "query").callsFake((query) => {
                spy(query);
                return {
                    rows: []
                };
            });
            const changeListener = new ChangeListener(
                client,
                {slotName: "test", createIfNotExists: true}
            );
            // Assert
            await assert.doesNotReject(async () => {
                // Act
                await changeListener.initReplicationSlot();
            }, "initialization of slot should raise exception when 'createIfNotExists' isn't set");
            assert(spy.callCount > 1);
        });
    });

    describe("getting changes from pg_create_logical_replication_slot", () => {
        it("no changes", () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            sinon.stub(client, "query").callsFake(() => {
                return {
                    rows: []
                };
            });
            const spy = sinon.spy();
            const changeListener = new ChangeListener(
                client,
                {slotName: "test", timeout: 1}
            );
            changeListener.on("changes", () => {
                spy();
            });
            // Assert
            assert.doesNotReject(async () => {
                // Act
                await changeListener.start();
                assert(!spy.called);
            });
        });

        it("got changes", () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            sinon.stub(client, "query").callsFake(() => {
                return {
                    rows: [{some: 1}, {rows: 2}]
                };
            });
            const spy = sinon.spy();
            const changeListener = new ChangeListener(
                client,
                {slotName: "test", timeout: 0}
            );
            changeListener.on("changes", () => {
                spy();
            });
            // Assert
            assert.doesNotReject(async () => {
                // Act
                await changeListener.start();
            });
        });
    });

    describe("next()", () => {
        it("if not running emits error event", () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            const changeListener = new ChangeListener(
                client,
                {timeout: 1}
            );
            const errorSpy = sinon.spy();
            sinon.stub(changeListener, "initReplicationSlot").resolves();
            changeListener.on("error", () => {
                errorSpy();
            });
            // Act
            changeListener.next();
            // Assert
            assert(errorSpy.called,
                "trying to use next() over not-started changeListener should emit errors");
        });

        it("if waiting (previous readChanges in progress), emits error event", async () => {
            // Arrange
            const client = new Client();
            sinon.stub(client, "connect").resolves();
            sinon.stub(client, "end").resolves();
            const changeListener = new ChangeListener(
                client,
                {timeout: 1}
            );
            const errorSpy = sinon.spy();
            sinon.stub(changeListener, "initReplicationSlot").resolves();
            changeListener.on("error", () => {
                errorSpy();
            });
            // Act
            await changeListener.start();
            const next1 = changeListener.next();
            const next2 = changeListener.next();
            await Promise.all([next1, next2]);

            // Assert
            assert(errorSpy.called,
                "trying to use next() over not-started changeListener should emit errors");
        });
    });
});
