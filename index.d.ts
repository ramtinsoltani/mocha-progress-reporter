import Mocha from 'mocha';
import ora from 'ora';
import color from 'chalk';
interface ProgressReporterOptions {
    /** Toggle logs (default: true). */
    logs: boolean;
    /** Toggle output colors (default: true). */
    colors: boolean;
    /** Toggle hook reports (default: true). */
    hooks: boolean;
}
declare class ProgressReporter {
    private events;
    /** Sends a progress message to the reporter for the current test. */
    progress(message: string): void;
    /** Clears the last progress message. */
    clear(): void;
    /** Logs a message without interrupting the reporter spinners. */
    log(message: any, ...additionalMessages: any[]): void;
    /** Logs a warning message without interrupting the reporter spinners. */
    warn(message: any, ...additionalMessages: any[]): void;
    /** Logs an error message without interrupting the reporter spinners. */
    error(message: any, ...additionalMessages: any[]): void;
    /** Configures the reporter. */
    config(options: Partial<ProgressReporterOptions>): void;
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
        stats: Mocha.Stats;
        spinner: ora.Ora;
        currentTestMessage: string;
        currentProgressMessage: string;
        currentLogs: string[];
        retries: number;
        testInProgress: boolean;
        logsRenderedLast: boolean;
        hookInProgress: boolean;
        config: ProgressReporterOptions;
        displayError(error: any): void;
        parseHookName(name: string): {
            suiteName?: string;
            hookType: string;
            hookName?: string;
            testName: string;
        };
        getHookMessage(fullTitle: string, begin?: boolean): string;
        rerender(): void;
        renderFinal(result: 'success' | 'fail' | 'hook-success' | 'hook-fail', message: string): void;
        renderLogs(): string;
        getTimeTag(duration: number): string;
        getDurationColorFunction(duration: number): color.Chalk;
        getRetryTag(): string;
        getTimeoutTag(error: Error): string;
    };
};
export = _default;
