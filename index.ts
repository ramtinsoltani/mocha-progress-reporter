import Mocha from 'mocha';
import { EventEmitter } from 'events';
import ora from 'ora';
import chalk from 'chalk';
import Base from 'mocha/lib/reporters/base';

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_PENDING,
  EVENT_TEST_PASS,
  EVENT_TEST_FAIL
} = Mocha.Runner.constants;

class ProgressReporter {

  private events = new EventEmitter;

  /** Send a progress message to the reporter for the current test. */
  progress(message: string) { this.events.emit('message', message); }

  /** Clear the last progress message. */
  clear() { this.events.emit('clear'); }

}

// Inject custom event emitter for sending progress messages to this reporter.
(<any>global).reporter = new ProgressReporter();

declare global {
  /**
  * An event emitter for sending progress messages during tests.
  * Use the event 'progress' to send progress messages for the current running test.
  * Use the event 'clear' to clear the last progress message.
  */
  const reporter: ProgressReporter;
}

export = class CustomReporter extends Base {

  constructor(runner: Mocha.Runner) {

    super(runner);

    const stats = runner.stats;
    const spinner = ora();
    let currentTestMessage: string = null;

    (<any>reporter)
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

      currentTestMessage = `${chalk.bold(test.parent.title)} ${test.title} ${chalk.yellow.bold('(running)')}`;

      spinner.start(currentTestMessage);

    })
    .on(EVENT_TEST_PASS, test => {

      (<any>reporter).emit('clear');

      spinner.succeed(`${chalk.bold(test.parent.title)} ${test.title} ${chalk.greenBright.bold('(passed)')}`);

    })
    .on(EVENT_TEST_FAIL, (test, error) => {

      (<any>reporter).emit('clear');

      spinner.fail(`${chalk.bold(test.parent.title)} ${test.title} ${chalk.redBright.bold('(failed)')}`);

      if ( error.showDiff ) {

        // Display diff
        console.log(Base.generateDiff(error.actual, error.expected));

        console.error(chalk.dim(error.stack));

      }
      else {

        console.error(chalk.redBright(error.message));
        console.error(chalk.dim(error.stack));

      }

    })
    .on(EVENT_TEST_PENDING, test => {

      spinner.stopAndPersist({
        symbol: chalk.dim('-'),
        text: chalk.dim(`${chalk.bold(test.parent.title)} ${test.title}`)
      });

    })
    .once(EVENT_RUN_END, () => {

      console.log();

      spinner.stopAndPersist({
        symbol: chalk.blueBright('i'),
        text: `Tests have finished with ${chalk.greenBright.bold(`${stats.passes} passes`)}, ${chalk.redBright.bold(`${stats.failures} failures`)}, and ${chalk.dim.bold.white(`${stats.pending} skips`)} after ${chalk.yellow(`${stats.duration}ms`)}`
      });

      console.log();

    });

  }

}
