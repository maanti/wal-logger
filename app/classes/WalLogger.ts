import PKeysCache from "./PKeysCache";
import Message from "./Message";
import DbWriter from "./DbWriter/DbWriter";
import ChangeListener from "./ChangeListener";
import IWal2JsonEvent from "../interfaces/IWal2JsonEvent";

/**
 * Main class.
 * Logging changes in parent app's database and store them.
 */
export default class WalLogger {
    private readonly _pKeysCache: PKeysCache;
    private readonly _changeListener: ChangeListener;
    private _dbWriter: DbWriter;

    constructor(
        changeListener: ChangeListener,
        dbWriter: DbWriter,
        pKeysCache: PKeysCache
    ) {
        this._changeListener = changeListener;
        this._dbWriter = dbWriter;
        this._pKeysCache = pKeysCache;
    }

    /**
     * Entry point. Starts data change listener.
     */
    public async start() {
        this._changeListener.on("changes", async (changes: Array<{ data: string }>) => {
            this.onChange(changes);
            await this._changeListener.next();
        });

        this._changeListener.on("error", (err: Error) => {
            console.error("err: ", err);
        });

        await this.initDbWriter();
        await this._changeListener.start();
    }

    private onChange(rawChanges: Array<{ data: string }>): void {
        const changes: IWal2JsonEvent[] = [];
        for (const rawChange of rawChanges) {
            changes.push(...JSON.parse(rawChange.data).change);
        }

        for (const change of changes) {
            change.pkColumns = this._pKeysCache.get(`${change.schema}.${change.table}`);
            const message: Message = new Message(change);
            this._dbWriter.saveMessage(message);
        }
    }

    private async initDbWriter(): Promise<void> {
        await this._dbWriter.connect();
    }
}
