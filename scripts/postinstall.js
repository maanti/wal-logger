"use strict";

const fs = require("fs");

const data = `{
    "defaultEnv": "local",
    "sql-file": true,
    "local": {
        "driver": "pg",
        "user": "walloger",
        "database": "walloger",
        "password": "walloger",
        "host": "127.0.0.1",
        "port": 5432
    }
}`;

(() => {
    console.log("scripts/postinstall.js");

    if (!fs.existsSync("./database.json")) {
        fs.writeFileSync("./database.json", data);
    } else {
        console.log("file database.json exists");
    }
})();
