"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mocha_1 = __importDefault(require("mocha"));
const events_1 = require("events");
const ora_1 = __importDefault(require("ora"));
const chalk_1 = __importDefault(require("chalk"));
const base_1 = __importDefault(require("mocha/lib/reporters/base"));
const { EVENT_RUN_BEGIN, EVENT_RUN_END, EVENT_TEST_BEGIN, EVENT_TEST_PENDING, EVENT_TEST_PASS, EVENT_TEST_FAIL } = mocha_1.default.Runner.constants;
class ProgressReporter {
    constructor() {
        this.events = new events_1.EventEmitter;
    }
    /** Send a progress message to the reporter for the current test. */
    progress(message) { this.events.emit('message', message); }
    /** Clear the last progress message. */
    clear() { this.events.emit('clear'); }
}
// Inject custom event emitter for sending progress messages to this reporter.
global.reporter = new ProgressReporter();
module.exports = class CustomReporter extends base_1.default {
    constructor(runner) {
        super(runner);
        const stats = runner.stats;
        const spinner = ora_1.default();
        let currentTestMessage = null;
        reporter
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
            currentTestMessage = `${chalk_1.default.bold(test.parent.title)} ${test.title} ${chalk_1.default.yellow.bold('(running)')}`;
            spinner.start(currentTestMessage);
        })
            .on(EVENT_TEST_PASS, test => {
            reporter.emit('clear');
            spinner.succeed(`${chalk_1.default.bold(test.parent.title)} ${test.title} ${chalk_1.default.greenBright.bold('(passed)')}`);
        })
            .on(EVENT_TEST_FAIL, (test, error) => {
            reporter.emit('clear');
            spinner.fail(`${chalk_1.default.bold(test.parent.title)} ${test.title} ${chalk_1.default.redBright.bold('(failed)')}`);
            if (error.showDiff) {
                // Display diff
                console.log(base_1.default.generateDiff(error.actual, error.expected));
                console.error(chalk_1.default.dim(error.stack));
            }
            else {
                console.error(chalk_1.default.redBright(error.message));
                console.error(chalk_1.default.dim(error.stack));
            }
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
                text: `Tests have finished with ${chalk_1.default.greenBright.bold(`${stats.passes} passes`)}, ${chalk_1.default.redBright.bold(`${stats.failures} failures`)}, and ${chalk_1.default.dim.bold.white(`${stats.pending} skips`)} after ${chalk_1.default.yellow(`${stats.duration}ms`)}`
            });
            console.log();
        });
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsa0RBQTBCO0FBQzFCLG1DQUFzQztBQUN0Qyw4Q0FBc0I7QUFDdEIsa0RBQTBCO0FBQzFCLG9FQUE0QztBQUU1QyxNQUFNLEVBQ0osZUFBZSxFQUNmLGFBQWEsRUFDYixnQkFBZ0IsRUFDaEIsa0JBQWtCLEVBQ2xCLGVBQWUsRUFDZixlQUFlLEVBQ2hCLEdBQUcsZUFBSyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7QUFFM0IsTUFBTSxnQkFBZ0I7SUFBdEI7UUFFVSxXQUFNLEdBQUcsSUFBSSxxQkFBWSxDQUFDO0lBUXBDLENBQUM7SUFOQyxvRUFBb0U7SUFDcEUsUUFBUSxDQUFDLE9BQWUsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRW5FLHVDQUF1QztJQUN2QyxLQUFLLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBRXZDO0FBRUQsOEVBQThFO0FBQ3hFLE1BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO0FBV2hELGlCQUFTLE1BQU0sY0FBZSxTQUFRLGNBQUk7SUFFeEMsWUFBWSxNQUFvQjtRQUU5QixLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFZCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzNCLE1BQU0sT0FBTyxHQUFHLGFBQUcsRUFBRSxDQUFDO1FBQ3RCLElBQUksa0JBQWtCLEdBQVcsSUFBSSxDQUFDO1FBRWhDLFFBQVM7YUFDZCxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBZSxFQUFFLEVBQUU7WUFFbEMsT0FBTyxDQUFDLElBQUksR0FBRyxHQUFHLGtCQUFrQixPQUFPLGVBQUssQ0FBQyxHQUFH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