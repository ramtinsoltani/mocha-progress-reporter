# Mocha Progress Reporter

Custom Mocha reporter with progress reporting ability.

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

```ts
// In any spec file that is imported in main spec
describe('Suite', function() {

  it('should pass this', function() {

    reporter.progress('Doing stuff');

    // Do stuff

    reporter.progress('Doing more stuff');

    // Do more stuff

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
  - **.clear()** Clears the last progress message. This also automatically happens at the end of every test case.
