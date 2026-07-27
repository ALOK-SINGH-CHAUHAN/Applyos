import { BrowseCommand } from "../base.js";
export default class Daemon extends BrowseCommand {
    static description: string;
    static hidden: boolean;
    static flags: {
        session: any;
        target: any;
    };
    run(): Promise<void>;
}
