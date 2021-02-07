import Mocha from 'mocha';
import { EventEmitter } from 'events';
import ora from 'ora';
import chalk from 'chalk';
import Base from 'mocha/lib/reporters/base';

class ProgressReporter {

  public events = new EventEmitter();

  /** Sends a progress message to the reporter for the current test. */
  progress(message: string) { this.events.emit('progress', message); }

  /** Clears the last progress message. */
  clear() { this.events.emit('clear'); }

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
  EVENT_TEST_RETRY
} = Mocha.Runner.constants;

(<any>global).reporter = new ProgressReporter();

export = class CustomReporter extends Base {

  constructor(runner: Mocha.Runner) {

    super(runner);

    const stats = runner.stats;
    const spinner = ora();
    let currentTestMessage: string = null;
    let retries = 0;

    (<any>reporter).events
    .on('progress', (message: string) => {

      spinner.text = `${currentTestMessage}\n  ${chalk.dim(message)}`;

    })
    .on('clear', () => {

      spinner.text = currentTestMessage;

    });

    runner
    .once(EVENT_RUN_BEGIN, () => {

      console.log();

      spinner.stopAndPersist({
        symbol: chalk.blueBright('i'),
        text: 'Tests have been started'
      });

      console.log();

    })
    .on(EVENT_TEST_BEGIN, test => {

      currentTestMessage = `${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk.yellow.bold('(running)')}`;

      spinner.start(currentTestMessage);

    })
    .on(EVENT_TEST_RETRY, (test: Mocha.Test) => {

      (<any>reporter).events.emit('clear');

      spinner.fail(`${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk.redBright.bold('(failed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);

      retries++;

    })
    .on(EVENT_TEST_PASS, test => {

      (<any>reporter).events.emit('clear');

      spinner.succeed(`${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk.greenBright.bold('(passed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);

      retries = 0;

    })
    .on(EVENT_TEST_FAIL, (test, error) => {

      (<any>reporter).events.emit('clear');

      spinner.fail(`${chalk.bold(test.parent.title)} ${test.title} ${this.getRetryTag(retries)}${chalk.redBright.bold('(failed)')} ${this.getDurationColor(test.duration)(`(${test.duration}ms)`)}`);

      if ( error.showDiff ) {

        // Display diff
        const diff = Base.generateDiff(error.actual, error.expected);

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

      retries = 0;

    })
    .on(EVENT_TEST_PENDING, test => {

      spinner.stopAndPersist({
        symbol: chalk.dim('-'),
        text: chalk.dim(`${chalk.bold(test.parent.title)} ${test.title} ${chalk.bold('(skipped)')}`)
      });

    })
    .once(EVENT_RUN_END, () => {

      console.log();

      spinner.stopAndPersist({
        symbol: chalk.blueBright('i'),
        text: `Tests have finished with ${chalk.greenBright.bold(`${stats.passes} passes`)}, ${chalk.redBright.bold(`${stats.failures} failures`)}, and ${chalk.dim.bold.white(`${stats.pending} skips`)} after ${this.getDurationColor(stats.duration)(`${stats.duration}ms`)}`
      });

      console.log();

    });

  }

  private getDurationColor(duration: number) {

    if ( duration < 500 ) return chalk.white;
    if ( duration < 1000 ) return chalk.yellow;
    if ( duration < 1500 ) return chalk.magenta;
    return chalk.redBright;

  }

  private getRetryTag(retries: number) {

    if ( ! retries ) return '';

    let tag = retries + '';

    if ( ['11', '12', '13'].includes(tag.substr(-2)) ) tag += 'th';
    else if ( tag.substr(-1) === '1' ) tag += 'st';
    else if ( tag.substr(-1) === '2') tag += 'nd';
    else if ( tag.substr(-1) === '3' ) tag += 'rd';
    else tag += 'th';

    return chalk.yellow.bold(`(${tag} retry) `);

  }

}
