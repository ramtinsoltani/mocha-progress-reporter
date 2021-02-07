/// <reference types="node" />
import Mocha from 'mocha';
import { EventEmitter } from 'events';
import chalk from 'chalk';
declare class ProgressReporter {
    events: EventEmitter;
    /** Sends a progress message to the reporter for the current test. */
    progress(message: string): void;
    /** Clears the last progress message. */
    clear(): void;
}
declare global {
    /**
    * An event emitter for sending progress messages during tests.
    * Use the event 'progress' to send progress messages for the current running test.
    * Use the event 'clear' to clear the last progress message.
    */
    const reporter: ProgressReporter;
}
declare const _default: {
    new (runner: Mocha.Runner): {
        getDurationColor(duration: number): chalk.Chalk;
        getRetryTag(retries: number): string;
        getTimeoutTag(error: Error): string;
    };
};
export = _default;
