import {Client} from "pg";
import assert from "assert";
import dotenv from "dotenv";
import request from "supertest";
import {Server} from "../app/api/Server";
import {IRequestData} from "../app/interfaces/IRequestData";
import sinon from "sinon";


describe("Server", () => {
    // Load environment variables
    dotenv.config();
    const server = new Server(new Client());
    server.initRoutes();
    describe("/log endpoint", () => {


        it("should return 400 for bad request", (done: (err?: any) => void) => {
            const badData = {ids: [78789]};
            request(server.app)
                .post("/log")
                .send(badData)
                .set("Accept", "application/json")
                .expect(400)
                .end((err) => {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });

        it("should return 200", (done: (err?: any) => void) => {
            const goodData = {ids: [78789], table: "table"};
            sinon.stub(server.log, "getData").resolves();
            request(server.app)
                .post("/log")
                .send(goodData)
                .set("Accept", "application/json")
                .expect(200)
                .end((err) => {
                    if (err) {
                        return done(err);
                    }
                    done();
                });
        });
    });

    describe("validateGetRequestBody()", () => {
        it("should allow simple table-ids search", () => {
            // Arrange
            const body: IRequestData = {
                table: "PUBLIC.ORDER",
                ids: [1, 2, 105]
            };
            // Act
            const error = Server.validateGetRequestBody(body);
            // Assert
            assert(error === null, "No error should be thrown");
        });

        it("should not accept ids without table", () => {
            // Arrange
            const body: IRequestData = {
                sort: {
                    column: "col",
                    direction: "ASC"
                },
                ids: [1, 2, 105]
            };
            // Act
            const error = Server.validateGetRequestBody(body);
            // Assert
            assert(error !== null, "Error expected");
        });

        it("should not accept request without a table or dates", () => {
            // Arrange
            const body: IRequestData = {};
            // Act
            const error = Server.validateGetRequestBody(body);
            // Assert
            assert(error !== null, "Error expected");
        });

        it("should not accept request without a table or dates", () => {
            // Arrange
            const body: IRequestData = {};
            // Act
            const error = Server.validateGetRequestBody(body);
            // Assert
            assert(error !== null, "Error expected");
        });
    });
});
