# Mocha Progress Reporter

Custom Mocha reporter with extra logging abilities. This reporter shows spinners for test cases while running and allows reporting progress mid-test for cases that take too long and need more context. Logs are also handled very well and stylized correctly, as opposed to the default Mocha reporter where console logs break the report style.

![terminal-recording](https://user-images.githubusercontent.com/7918069/107141626-dcb7e600-68de-11eb-942a-774359eb3144.gif)

## Installation

```bash
npm install mocha-progress-reporter --save-dev
```

ES6 import:
```ts
// Globally available in all tests with one import in main spec
import 'mocha-progress-reporter';
```

CommonJS import:
```ts
// Globally available in all tests with one import in main spec
require('mocha-progress-reporter');
```

## Usage

Configure the reporter (if needed):
```ts
// In main spec file
import 'mocha-progress-reporter';

reporter.config({ hooks: false });
```

Use the reporter for progress and logs:
```ts
// In any spec file that is imported in main spec
describe('Suite', function() {

  beforeEach(function() {

    reporter.progress('Preparing stuff');

    // Prepare stuff

    reporter.warn('Stuff not fully prepared, but we should be good nonetheless!');

  });

  it('should pass this', function() {

    reporter.progress('Doing stuff');

    // Do stuff

    reporter.progress('Doing more stuff');

    // Do more stuff

    reporter.log('Important log that should stay');

  });

});
```

Running Mocha:
```bash
mocha ./main.spec --reporter mocha-progress-reporter
```

## API

The following methods are defined on the `reporter` object:
  - **.progress(message)** Sends a progress message to the reporter for the current test.
  - **.clear()** Clears the last progress message. This is automatically called at the end of every test case and therefore not manually used very often.
  - **.log(message[, additionalMessages])** Logs a message without breaking the spinners.
  - **.warn(message[, additionalMessages])** Logs a warning message without breaking the spinners.
  - **.error(message[, additionalMessages])** Logs an error message without breaking the spinners.
  - **.config(options)** Configures the reporter with the following options:
    - **hooks** When `true`, running hooks will be shown in the terminal. Default `true`.
    - **colors** When `false` all logs will be plain white. Default `true`.
    - **logs** When `false`, `.log()`, `.warn()`, and `.error()` logs will be ignored. Default `true`.
