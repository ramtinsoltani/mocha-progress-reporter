import Mocha from 'mocha';
declare class ProgressReporter {
    private events;
    /** Send a progress message to the reporter for the current test. */
    progress(message: string): void;
    /** Clear the last progress message. */
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
    new (runner: Mocha.Runner): {};
};
export = _default;
