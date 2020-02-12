import express from "express";
import Joi from "joi";
import bodyParser from "body-parser";
import {Client} from "pg";
import {IRequestData} from "../interfaces/IRequestData";

export {Server};

class Server {
    public static validateGetRequestBody(body: IRequestData): Error | null {
        const schema: Joi.ObjectSchema = Joi.object({
            date: Joi.object({
                from: Joi.date(),
                to: Joi.date().greater(Joi.ref("from")).default(new Date())
            }).optional(),
            table: Joi.string().uppercase(),
            ids: Joi.array().items(Joi.number()),
            sort: {
                column: Joi.string().required(),
                direction: Joi.string()
                    .valid("ASC", "DESC")
                    .uppercase()
                    .default("ASC")
            }
        }).with("ids", "table")
            .or("table", "date");

        const {error} = schema.validate(body);
        return error;
    }

    private readonly _app: express.Application;
    private _client: Client;

    constructor(slaveDbClient: Client) {
        this._client = slaveDbClient;
        this._app = express();
        this._app.use(bodyParser.json());
        this.initRoutes();
        const port = process.env.API_PORT;
        this._app.listen(port, () => {
            console.log(`Server started at http://localhost:${port}`);
        });
    }

    get app() {
        return this._app;
    }

    public initRoutes() {
        this._app.post("/log", (req, res) => {
            const error = Server.validateGetRequestBody(req.body);
            if (error) {
                res.status(400);
                res.send(error);
            } else {
                res.send("Hello world!");
            }
            res.end();
        });
    }
}
