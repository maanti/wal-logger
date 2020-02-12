export {IRequestData};

interface IRequestData {
    date?: {
        from: Date;
        to: Date;
    };
    table?: string;
    ids?: number[];
    sort?: {
        column: string;
        direction: "ASC" | "DESC"
    };
}
