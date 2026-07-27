import { Command } from "@oclif/core";
export declare abstract class BrowseCommand extends Command {
    init(): Promise<void>;
    protected catch(err: Error & {
        exitCode?: number;
    }): Promise<unknown>;
}
