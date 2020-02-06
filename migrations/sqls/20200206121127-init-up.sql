CREATE TABLE db_operation_type
(
    name TEXT PRIMARY KEY
);

INSERT INTO db_operation_type(name)
VALUES ('INSERT'),
    ('UPDATE'),
    ('DELETE'),
    ('TRASH'),
    ('UNTRASH');

CREATE TABLE log
(
    id SERIAL PRIMARY KEY,
    dt_create TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    query TEXT,
    field TEXT,
    old_value TEXT,
    new_value TEXT,
    operation_type_code TEXT REFERENCES db_operation_type (name),
    pkey JSON
);
