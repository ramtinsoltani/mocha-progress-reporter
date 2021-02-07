import Mocha from 'mocha';
import { EventEmitter } from 'events';
import ora from 'ora';
import color from 'chalk';
import util from 'util';
import stripAnsi from 'strip-ansi';
import Base from 'mocha/lib/reporters/base';

let chalk = new color.Instance();
let reporterOptions: Partial<ProgressReporterOptions> = {};

interface ProgressReporterOptions {

  /** Toggle logs (default: true). */
  logs: boolean;
  /** Toggle output colors (default: true). */
  colors: boolean;
  /** Toggle hook reports (default: true). */
  hooks: boolean;

}

class ProgressReporter {

  private events = new EventEmitter();

  /** Sends a progress message to the reporter for the current test. */
  progress(message: string) { this.events.emit('progress', message); }

  /** Clears the last progress message. */
  clear() { this.events.emit('clear'); }

  /** Logs a message without interrupting the reporter spinners. */
  log(message: any, ...additionalMessages: any[]) {

    this.events.emit('log', [message, ...additionalMessages].map(m => {

      if ( m && typeof m === 'object' && (m.constructor === Object || m.constructor === Array) )
        return util.inspect(m, false, 4, true);
      else
        return m;

    }).join(' '));

  }

  /** Logs a warning message without interrupting the reporter spinners. */
  warn(message: any, ...additionalMessages: any[]) { this.log(chalk.yellow(message), ...additionalMessages.map(m => chalk.yellow(m))); }

  /** Logs an error message without interrupting the reporter spinners. */
  error(message: any, ...additionalMessages: any[]) { this.log(chalk.redBright(message), ...additionalMessages.map(m => chalk.redBright(m))); }

  /** Configures the reporter. */
  config(options: Partial<ProgressReporterOptions>) {

    this.events.emit('config', options);
    reporterOptions = Object.assign({}, options);

  }

}

declare global {
  /**
  * An event emitter for sending progress messages during tests.
  * Use the event 'progress' to send progress messages for the current running test.
  * Use the event 'clear' to clear the last progress message.
  */
  const reporter: ProgressReporter;

}

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_PENDING,
  EVENT_TEST_PASS,
  EVENT_TEST_FAIL,
  EVENT_TEST_RETRY,
  EVENT_HOOK_BEGIN,
  EVENT_HOOK_END
} = Mocha.Runner.constants;

(<any>global).reporter = new ProgressReporter();

export = class CustomReporter extends Base {

  private stats: Mocha.Stats;
  private spinner = ora();
  private currentTestMessage: string = null;
  private currentProgressMessage: string = null;
  private currentLogs: string[] = [];
  private retries: number = 0;
  private testInProgress: boolean = false;
  private logsRenderedLast: boolean = false;
  private hookInProgress: boolean = false;
  private config: ProgressReporterOptions = Object.assign({
    logs: true,
    colors: true,
    hooks: true
  }, reporterOptions);

  constructor(runner: Mocha.Runner) {

    super(runner);

    (<any>reporter).events
    .on('progress', (message: string) => {

      if ( ! this.testInProgress && ! this.hookInProgress ) return;

      this.currentProgressMessage = message;
      this.rerender();

    })
    .on('log', (message: string) => {

      if ( ! this.config.logs ) return;

      if ( ! this.testInProgress && ! this.hookInProgress ) return console.log('\n  ' + message);

      this.currentLogs.push(this.config.colors ? message : stripAnsi(message));
      this.rerender();

    })
    .on('clear', () => {

      this.currentProgressMessage = null;
      this.rerender();

    })
    .on('config', (options: Partial<ProgressReporterOptions>) => {

      this.config = Object.assign({}, this.config, options);

      chalk = this.config.colors ? new color.Instance() : new color.Instance({ level: 0 });
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

      if ( ! this.config.hooks ) return;

      this.hookInProgress = true;

      this.currentTestMessage = this.getHookMessage(hook.fullTitle(), true);

      if ( this.logsRenderedLast ) console.log();

      this.logsRenderedLast = false;

      this.spinner.start(this.currentTestMessage);

    })
    .on(EVENT_HOOK_END, hook => {

      if ( ! this.config.hooks && ! this.hookInProgress ) return;

      this.hookInProgress = false;
      this.currentProgressMessage = null;
      this.rerender();

      this.renderFinal('hook-success', this.getHookMessage(hook.fullTitle()));

      this.currentLogs = [];

    })
    .on(EVENT_TEST_BEGIN, test => {

      this.testInProgress = true;

      this.currentTestMessage = `${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag()}${chalk.yellow.bold('(running)')}`;

      if ( this.logsRenderedLast ) console.log();

      this.logsRenderedLast = false;

      this.spinner.start(this.currentTestMessage);

    })
    .on(EVENT_TEST_RETRY, (test: Mocha.Test, error: Error) => {

      this.currentProgressMessage = null;
      this.rerender();

      this.renderFinal('fail', `${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag()}${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);

      this.currentLogs = [];
      this.retries++;

    })
    .on(EVENT_TEST_PASS, test => {

      this.testInProgress = false;
      this.currentProgressMessage = null;
      this.rerender();

      this.renderFinal('success', `${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag()}${chalk.greenBright.bold('(passed)')} ${this.getTimeTag(test.duration)}`);

      this.currentLogs = [];
      this.retries = 0;

    })
    .on(EVENT_TEST_FAIL, (test, error) => {

      const hookFailed = this.hookInProgress;

      if ( hookFailed ) this.hookInProgress = false;
      else this.testInProgress = false;
      this.currentProgressMessage = null;
      this.rerender();

      if ( hookFailed ) {

        const hook = (<Mocha.Hook><unknown>test);

        this.renderFinal('hook-fail', `${this.getHookMessage(hook.fullTitle())} ${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);

      }
      else {

        this.renderFinal('fail', `${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag()}${chalk.redBright.bold('(failed)')} ${this.getTimeoutTag(error)}${this.getTimeTag(test.duration)}`);

      }

      this.currentLogs = [];
      this.retries = 0;

      this.displayError(error);

    })
    .on(EVENT_TEST_PENDING, test => {

      this.spinner.stopAndPersist({
        symbol: chalk.dim('-'),
        text: chalk.dim(`${chalk.bold(test.parent.title)} ${test.title} ${chalk.bold('(skipped)')}`)
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

  private displayError(error: any) {

    // If not timeout error
    if ( this.getTimeoutTag(error) === '' ) {

      if ( error.showDiff ) {

        // Display diff
        let diff = Base.generateDiff(error.actual, error.expected);

        if ( ! this.config.colors ) diff = stripAnsi(diff);

        if ( diff.includes('failed to generate Mocha diff') )
          console.error('\n' + chalk.redBright('  ' + error.message.replace(/\n/g, '  \n')) + '\n');
        else
          console.log(diff.split('\n').map(line => line.substr(4)).join('\n'));

        console.error(chalk.dim('  ' + error.stack.replace(/\n/g, '  \n')));

      }
      else {

        console.error('\n' + chalk.redBright('  '+ error.message.replace(/\n/g, '  \n')) + '\n');
        console.error(chalk.dim('  ' + error.stack.replace(/\n/g, '  \n')));

      }

    }

    console.log();

  }

  private parseHookName(name: string): { suiteName?: string; hookType: string; hookName?: string; testName: string; } {

    const match = name.match(/^((?<suiteName>.*?) )?"(?<hookType>.+?)" hook(: (?<hookName>.+))? ((for)|(in)) "(?<testName>.+)"$/);

    if ( ! match ) return null;

    return <any>match.groups;

  }

  private getHookMessage(fullTitle: string, begin?: boolean) {

    const parsed = this.parseHookName(fullTitle);

    if ( ! parsed ) return chalk.yellow(`Unkown hook ${begin ? 'is running' : 'has finished running'}`);

    return `${chalk.yellow.bold(parsed.hookType)} hook ` +
    `${parsed.hookName ? `${chalk.bold(`"${parsed.hookName}"`)} ` : ''}` +
    `${begin ? 'is running' : 'has finished running'} ` +
    `${['after each', 'before each'].includes(parsed.hookType) ? 'for the last test' : (parsed.testName === '{root}' ? `${parsed.hookType} suites` : `${parsed.hookType.split(' ')[0]} ${chalk.blueBright.bold(parsed.suiteName)} suite`)}`;

  }

  private rerender() {

    const progressLog = this.currentProgressMessage ? `\n  ${chalk.dim(this.currentProgressMessage)}` : '';
    const logsLog = this.renderLogs();

    this.spinner.text = `${this.currentTestMessage}${progressLog}${logsLog}`;
    this.logsRenderedLast = !! logsLog;

  }

  private renderFinal(result: 'success'|'fail'|'hook-success'|'hook-fail', message: string) {

    const logsLog = this.renderLogs();

    if ( result === 'success' ) this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.greenBright('✔') });
    else if ( result === 'fail' ) this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.redBright('✖') });
    else if ( result === 'hook-success' ) this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.yellow.bold('~') });
    else this.spinner.stopAndPersist({ text: message + logsLog, symbol: chalk.redBright.bold('!') });

    this.logsRenderedLast = !! logsLog;

  }

  private renderLogs() {

    return this.currentLogs.length ? `\n\n  ${this.currentLogs.join('\n').replace(/\n/g, '\n  ')}` : '';

  }

  private getTimeTag(duration: number) {

    return this.getDurationColorFunction(duration)(`(${duration}ms)`);

  }

  private getDurationColorFunction(duration: number) {

    if ( duration < 500 ) return chalk.white.bold;
    if ( duration < 1000 ) return chalk.yellow.bold;
    if ( duration < 1500 ) return chalk.magenta.bold;
    return chalk.redBright.bold;

  }

  private getRetryTag() {

    if ( ! this.retries ) return '';

    let tag = this.retries + '';

    if ( ['11', '12', '13'].includes(tag.substr(-2)) ) tag += 'th';
    else if ( tag.substr(-1) === '1' ) tag += 'st';
    else if ( tag.substr(-1) === '2') tag += 'nd';
    else if ( tag.substr(-1) === '3' ) tag += 'rd';
    else tag += 'th';

    return chalk.yellow.bold(`(${tag} retry) `);

  }

  private getTimeoutTag(error: Error) {

    const match = error.message.match(/^Timeout of \d+ms exceeded\..+/);

    if ( ! match ) return '';

    return chalk.cyanBright.bold(`(timeout) `);

  }

}
