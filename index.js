"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mocha_1 = __importDefault(require("mocha"));
const events_1 = require("events");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const base_1 = __importDefault(require("mocha/lib/reporters/base"));
class ProgressReporter {
    constructor() {
        this.events = new events_1.EventEmitter();
    }
    /** Sends a progress message to the reporter for the current test. */
    progress(message) { this.events.emit('progress', message); }
    /** Clears the last progress message. */
    clear() { this.events.emit('clear'); }
}
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_BEGIN, EVENT_TEST_PENDING, EVENT_TEST_PASS, EVENT_TEST_FAIL, EVENT_TEST_RETRY } = mocha_1.default.Runner.constants;
global.reporter = new ProgressReporter();
module.exports = class CustomReporter extends base_1.default {
    constructor(runner) {
        super(runner);
        const stats = runner.stats;
        const spinner = ora_1.default();
        let currentTestMessage = null;
        let retries = 0;
        reporter.events
            .on('progress', (message) => {
            spinner.text = `${currentTestMessage}\n  ${chalk_1.default.dim(message)}`;
        })
            .on('clear', () => {
            spinner.text = currentTestMessage;
        });
        runner
            .once(EVENT_RUN_BEGIN, () => {
            console.log();
            spinner.stopAndPersist({
                symbol: chalk_1.default.blueBright('i'),
                text: 'Tests have been started'
            });
            console.log();
        })
            .on(EVENT_TEST_BEGIN, test => {
            currentTestMessage = `${chalk_1.default.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk_1.default.yellow.bold('(running)')}`;
            spinner.start(currentTestMessage);
        })
            .on(EVENT_TEST_RETRY, (test, error) => {
            reporter.events.emit('clear');
            spinner.fail(`${chalk_1.default.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk_1.default.redBright.bold('(failed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);
            if (error.showDiff) {
                // Display diff
                console.log(base_1.default.generateDiff(error.actual, error.expected));
                console.error(chalk_1.default.dim(error.stack));
            }
            else {
                console.error(chalk_1.default.redBright(error.message));
                console.error(chalk_1.default.dim(error.stack));
            }
            retries++;
        })
            .on(EVENT_TEST_PASS, test => {
            reporter.events.emit('clear');
            spinner.succeed(`${chalk_1.default.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk_1.default.greenBright.bold('(passed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);
            retries = 0;
        })
            .on(EVENT_TEST_FAIL, (test, error) => {
            reporter.events.emit('clear');
            spinner.fail(`${chalk_1.default.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk_1.default.redBright.bold('(failed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);
            if (error.showDiff) {
                // Display diff
                console.log(base_1.default.generateDiff(error.actual, error.expected));
                console.error(chalk_1.default.dim(error.stack));
            }
            else {
                console.error(chalk_1.default.redBright(error.message));
                console.error(chalk_1.default.dim(error.stack));
            }
            retries = 0;
        })
            .on(EVENT_TEST_PENDING, test => {
            spinner.stopAndPersist({
                symbol: chalk_1.default.dim('-'),
                text: chalk_1.default.dim(`${chalk_1.default.bold(test.parent.title)} ${test.title}`)
            });
        })
            .once(EVENT_RUN_END, () => {
            console.log();
            spinner.stopAndPersist({
                symbol: chalk_1.default.blueBright('i'),
                text: `Tests have finished with ${chalk_1.default.greenBright.bold(`${stats.passes} passes`)}, ${chalk_1.default.redBright.bold(`${stats.failures} failures`)}, and ${chalk_1.default.dim.bold.white(`${stats.pending} skips`)} after ${this.getDurationColor(stats.duration)(`${stats.duration}ms`)}`
            });
            console.log();
        });
    }
    getDurationColor(duration) {
        if (duration < 500)
            return chalk_1.default.white;
        if (duration < 1000)
            return chalk_1.default.yellow;
        if (duration < 1500)
            return chalk_1.default.magenta;
        return chalk_1.default.redBright;
    }
    getRetryTag(retries) {
        if (!retries)
            return '';
        let tag = retries + '';
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
        return chalk_1.default.yellow.bold(`(${tag} retry) `);
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsa0RBQTBCO0FBQzFCLG1DQUFzQztBQUN0Qyw4Q0FBc0I7QUFDdEIsa0RBQTBCO0FBQzFCLG9FQUE0QztBQUU1QyxNQUFNLGdCQUFnQjtJQUF0QjtRQUVTLFdBQU0sR0FBRyxJQUFJLHFCQUFZLEVBQUUsQ0FBQztJQVFyQyxDQUFDO0lBTkMscUVBQXFFO0lBQ3JFLFFBQVEsQ0FBQyxPQUFlLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRSx3Q0FBd0M7SUFDeEMsS0FBSyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUV2QztBQVlELE1BQU0sRUFDSixlQUFlLEVBQ2YsYUFBYSxFQUNiLGdCQUFnQixFQUNoQixrQkFBa0IsRUFDbEIsZUFBZSxFQUNmLGVBQWUsRUFDZixnQkFBZ0IsRUFDakIsR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUVyQixNQUFPLENBQUMsUUFBUSxHQUFHLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztBQUVoRCxpQkFBUyxNQUFNLGNBQWUsU0FBUSxjQUFJO0lBRXhDLFlBQVksTUFBb0I7UUFFOUIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUMzQixNQUFNLE9BQU8sR0FBRyxhQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJLGtCQUFrQixHQUFXLElBQUksQ0FBQztRQUN0QyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFFVixRQUFTLENBQUMsTUFBTTthQUNyQixFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBZSxFQUFFLEVBQUU7WUFFbEMsT0FBTyxD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