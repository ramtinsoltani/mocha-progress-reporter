"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mocha_1 = __importDefault(require("mocha"));
const events_1 = require("events");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const util_1 = __importDefault(require("util"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const base_1 = __importDefault(require("mocha/lib/reporters/base"));
let chalk = new chalk_1.default.Instance();
let reporterOptions = {};
class ProgressReporter {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
    /** Sends a progress message to the reporter for the current test. */
    progress(message) { this.events.emit('progress', message); }
    /** Clears the last progress message. */
    clear() { this.events.emit('clear'); }
    /** Logs a message without interrupting the reporter spinners. */
    log(message, ...additionalMessages) {
        this.events.emit('log', [message, ...additionalMessages].map(m => {
            if (m && typeof m === 'object' && (m.constructor === Object || m.constructor === Array))
                return util_1.default.inspect(m, false, 4, true);
            else
                return m;
        }).join(' '));
    }
    /** Logs a warning message without interrupting the reporter spinners. */
    warn(message, ...additionalMessages) { this.log(chalk.yellow(message), ...additionalMessages.map(m => chalk.yellow(m))); }
    /** Logs an error message without interrupting the reporter spinners. */
    error(message, ...additionalMessages) { this.log(chalk.redBright(message), ...additionalMessages.map(m => chalk.redBright(m))); }
    /** Configures the reporter. */
    config(options) {
        this.events.emit('config', options);
        reporterOptions = Object.assign({}, options);
    }
}
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_BEGIN, EVENT_TEST_PENDING, EVENT_TEST_PASS, EVENT_TEST_FAIL, EVENT_TEST_RETRY, EVENT_HOOK_BEGIN, EVENT_HOOK_END } = mocha_1.default.Runner.constants;
global.reporter = new ProgressReporter();
module.exports = class CustomReporter extends base_1.default {
    constructor(runner) {
        super(runner);
        this.spinner = ora_1.default();
        this.currentTestMessage = null;
        this.currentProgressMessage = null;
        this.currentLogs = [];
        this.retries = 0;
        this.testInProgress = false;
        this.logsRenderedLast = false;
        this.hookInProgress = false;
        this.config = Object.assign({
            logs: true,
            colors: true,
            hooks: true
        }, reporterOptions);
        reporter.events
            .on('progress', (message) => {
            if (!this.testInProgress && !this.hookInProgress)
                return;
            this.currentProgressMessage = message;
            this.rerender();
        })
            .on('log', (message) => {
            if (!this.config.logs)
                return;
            if (!this.testInProgress && !this.hookInProgress)
                return console.log('\n  ' + message);
            this.currentLogs.push(this.config.colors ? message : strip_ansi_1.default(message));
            this.rerender();
        })
            .on('clear', () => {
            this.currentProgressMessage = null;
            this.rerender();
        })
            .on('config', (options) => {
            this.config = Object.assign({}, this.config, options);
            chalk = this.config.colors ? new chalk_1.default.Instance() : new chalk_1.default.Instance({ level: 0 });
            this.spinner.color = this.config.colors ? 'cyan' : 'white';
        });
        runner
            .once(EVENT_RUN_BEGIN, () => {
            console.log();
            this.spinner.stopAndPersist({
                symbol: chalk.blueBright('i'),
                text: 'Tests have been started'
            });
            console.log();
        })
            .on(EVENT_HOOK_BEGIN, hook => {
            if (!this.config.hooks)
                return;
            this.hookInProgress = true;
            this.currentTestMessage = this.getHookMessage(hook.fullTitle(), true);
            if (this.logsRenderedLast)
                console.log();
            this.logsRenderedLast = false;
            this.spinner.start(this.currentTestMessage);
        })
            .on(EVENT_HOOK_END, hook => {
            if (!this.config.hooks && !this.hookInProgress)
                return;
            this.hookInProgress = false;
            this.currentProgressMessage = null;
            this.rerender();
            this.renderFinal('hook-success', this.getHookMessage(hook.fullTitle()));
            this.currentLogs = [];
        })
            .on(EVENT_TEST_BEGIN, test => {
            this.testInProgress = true;
            this.currentTestMessage = `${chalk.bold(test.parent.fullTitle())} ${test.title} ${this.getRetryTag()}${chalk.yellow.bold('(running)')}`;
            if (this.logsRenderedLast)
                console.log();
            this.logsRenderedLast = false;
            this.spinner.start(this.currentTestMessage);
        })
            .on(EVENT_TEST_RETRY, (test, error) => {
            this.currentProgressMessage = null;
            this.rerender();
            this.renderFinal('fail', `${chalk.bold(test.parent.fullTitle())} ${test.title} ${this.getRetryTag()}${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);
            this.currentLogs = [];
            this.retries++;
        })
            .on(EVENT_TEST_PASS, test => {
            this.testInProgress = false;
            this.currentProgressMessage = null;
            this.rerender();
            this.renderFinal('success', `${chalk.bold(test.parent.fullTitle())} ${test.title} ${this.getRetryTag()}${chalk.greenBright.bold('(passed)')} ${this.getTimeTag(test.duration)}`);
            this.currentLogs = [];
            this.retries = 0;
        })
            .on(EVENT_TEST_FAIL, (test, error) => {
            const hookFailed = this.hookInProgress;
            if (hookFailed)
                this.hookInProgress = false;
            else
                this.testInProgress = false;
            this.currentProgressMessage = null;
            this.rerender();
            if (hookFailed) {
                const hook = test;
                this.renderFinal('hook-fail', `${this.getHookMessage(hook.fullTitle())} ${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);
            }
            else {
                this.renderFinal('fail', `${chalk.bold(test.parent.fullTitle())} ${test.title} ${this.getRetryTag()}${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);
            }
            this.currentLogs = [];
            this.retries = 0;
            this.displayError(error);
        })
            .on(EVENT_TEST_PENDING, test => {
            this.spinner.stopAndPersist({
                symbol: chalk.dim('-'),
                text: chalk.dim(`${chalk.bold(test.parent.fullTitle())} ${test.title} ${chalk.bold('(skipped)')}`)
            });
        })
            .once(EVENT_RUN_END, () => {
            console.log();
            this.spinner.stopAndPersist({
                symbol: chalk.blueBright('i'),
                text: `Tests have finished with ${chalk.greenBright.bold(`${this.stats.passes} passes`)}, ${chalk.redBright.bold(`${this.stats.failures} failures`)}, and ${chalk.dim.bold.white(`${this.stats.pending} skips`)} after ${this.getDurationColorFunction(this.stats.duration)(`${this.stats.duration}ms`)}`
            });
            console.log();
        });
    }
    displayError(error) {
        // If not timeout error
        if (this.getTimeoutTag(error) === '') {
            if (error.showDiff) {
                // Display diff
                let diff = base_1.default.generateDiff(error.actual, error.expected);
                if (!this.config.colors)
                    diff = strip_ansi_1.default(diff);
                if (diff.includes('failed to generate Mocha diff'))
                    console.error('\n' + chalk.redBright('  ' + error.message.replace(/\n/g, '  \n')) + '\n');
                else
                    console.log(diff.split('\n').map(line => line.substr(4)).join('\n'));
                console.error(chalk.dim('  ' + error.stack.replace(/\n/g, '  \n')));
            }
            else {
                console.error('\n' + chalk.redBright('  ' + error.message.replace(/\n/g, '  \n')) + '\n');
                console.error(chalk.dim('  ' + error.stack.replace(/\n/g, '  \n')));
            }
        }
        console.log();
    }
    parseHookName(name) {
        const match = name.match(/^((?<suiteName>.*?) )?"(?<hookType>.+?)" hook(: (?<hookName>.+))? ((for)|(in)) "(?<testName>.+)"$/);
        if (!match)
            return null;
        return match.groups;
    }
    getHookMessage(fullTitle, begin) {
        const parsed = this.parseHookName(fullTitle);
        if (!parsed)
            return chalk.yellow(`Unkown hook ${begin ? 'is running' : 'has finished running'}`);
        return `${chalk.yellow.bold(parsed.hookType)} hook ` +
            `${parsed.hookName ? `${chalk.bold(`"${parsed.hookName}"`)} ` : ''}` +
            `${begin ? 'is running' : 'has finished running'} ` +
            `${['after each', 'before each'].includes(parsed.hookType) ? 'for the last test' : (parsed.testName === '{root}' ? `${parsed.hookType} suites` : `${parsed.hookType.split(' ')[0]} ${chalk.blueBright.bold(parsed.suiteName)} suite`)}`;
    }
    rerender() {
        const progressLog = this.currentProgressMessage ? `\n  ${chalk.dim(this.currentProgressMessage)}` : '';
        const logsLog = this.renderLogs();
        this.spinner.text = `${this.currentTestMessage}${progressLog}${logsLog}`;
        this.logsRenderedLast = !!logsLog;
    }
    renderFinal(result, message) {
        const logsLog = this.renderLogs();
        if (result === 'success')
            this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.greenBright('✔') });
        else if (result === 'fail')
            this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.redBright('✖') });
        else if (result === 'hook-success')
            this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.yellow.bold('~') });
        else
            this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.redBright.bold('!') });
        this.logsRenderedLast = !!logsLog;
    }
    renderLogs() {
        return this.currentLogs.length ? `\n\n  ${this.currentLogs.join('\n').replace(/\n/g, '\n  ')}` : '';
    }
    getTimeTag(duration) {
        return this.getDurationColorFunction(duration)(`(${duration}ms)`);
    }
    getDurationColorFunction(duration) {
        if (duration < 500)
            return chalk.white.bold;
        if (duration < 1000)
            return chalk.yellow.bold;
        if (duration < 1500)
            return chalk.magenta.bold;
        return chalk.redBright.bold;
    }
    getRetryTag() {
        if (!this.retries)
            return '';
        let tag = this.retries + '';
        if (['11', '12', '13'].includes(tag.substr(-2)))
            tag += 'th';
        else if (tag.substr(-1) === '1')
            tag += 'st';
        else if (tag.substr(-1) === '2')
            tag += 'nd';
        else if (tag.substr(-1) === '3')
            tag += 'rd';
        else
            tag += 'th';
        return chalk.yellow.bold(`(${tag} retry) `);
    }
    getTimeoutTag(error) {
        const match = error.message.match(/^Timeout of \d+ms exceeded\..+/);
        if (!match)
            return '';
        return chalk.cyanBright.bold(`(timeout) `);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsa0RBQTBCO0FBQzFCLG1DQUFzQztBQUN0Qyw4Q0FBc0I7QUFDdEIsa0RBQTBCO0FBQzFCLGdEQUF3QjtBQUN4Qiw0REFBbUM7QUFDbkMsb0VBQTRDO0FBRTVDLElBQUksS0FBSyxHQUFHLElBQUksZUFBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ2pDLElBQUksZUFBZSxHQUFxQyxFQUFFLENBQUM7QUFhM0QsTUFBTSxnQkFBZ0I7SUFBdEI7UUFFVSxXQUFNLEdBQUcsSUFBSSxxQkFBWSxFQUFFLENBQUM7SUFvQ3RDLENBQUM7SUFsQ0MscUVBQXFFO0lBQ3JFLFFBQVEsQ0FBQyxPQUFlLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRSx3Q0FBd0M7SUFDeEMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0QyxpRUFBaUU7SUFDakUsR0FBRyxDQUFDLE9BQVksRUFBRSxHQUFHLGtCQUF5QjtRQUU1QyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUUvRCxJQUFLLENBQUMsSUFBSSxPQUFPLENBQUMsS0FBSyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQztnQkFDdEYsT0FBTyxjQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDOztnQkFFdkMsT0FBTyxDQUFDLENBQUM7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