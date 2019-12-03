export default abstract class DbWriter {
    public abstract connect(): Promise<void>;

    public abstract writeRow(change: any): Promise<void>;
}
