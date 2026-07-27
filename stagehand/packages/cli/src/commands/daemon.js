import { Flags } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { runDriverDaemon } from "../lib/driver/daemon/server.js";
import { sessionName } from "../lib/driver/flags.js";
export default class Daemon extends BrowseCommand {
    static description = "Run the private browse driver daemon.";
    static hidden = true;
    static flags = {
        session: Flags.string({
            required: true,
            description: "Named browser session.",
        }),
        target: Flags.string({
            required: true,
            description: "Serialized driver connection target.",
        }),
    };
    async run() {
        const { flags } = await this.parse(Daemon);
        await runDriverDaemon({
            session: sessionName(flags.session),
            target: JSON.parse(flags.target),
        });
    }
}
