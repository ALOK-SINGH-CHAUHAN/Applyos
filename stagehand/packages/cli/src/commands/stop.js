import { Flags } from "@oclif/core";
import { BrowseCommand } from "../base.js";
import { sessionFlag, sessionName } from "../lib/driver/flags.js";
import { stopDriverDaemon } from "../lib/driver/daemon/client.js";
import { outputJson } from "../lib/output.js";
export default class Stop extends BrowseCommand {
    static description = "Stop the browse driver daemon for a named session.";
    static examples = [
        "browse stop",
        "browse stop --session research",
        "browse stop --force",
    ];
    static flags = {
        force: Flags.boolean({
            description: "Clean up daemon state files if the daemon is unresponsive.",
        }),
        session: sessionFlag,
    };
    async run() {
        const { flags } = await this.parse(Stop);
        const session = sessionName(flags.session);
        const result = await stopDriverDaemon(session, flags.force);
        outputJson({ ...result, session });
    }
}
