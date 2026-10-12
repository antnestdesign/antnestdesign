export default class RegressionReporter {
  onTestRunStart() {
    this.counts = { total: 0, pass: 0, knownFailure: 0, fail: 0, skipped: 0 };
  }

  onTestCaseResult(testCase) {
    this.counts.total += 1;
    const state = testCase.result().state;
    if (state === "passed") {
      if (testCase.fullName.includes("KNOWN FAILURE:")) this.counts.knownFailure += 1;
      else this.counts.pass += 1;
    } else if (state === "failed") this.counts.fail += 1;
    else this.counts.skipped += 1;
  }

  onTestRunEnd(modules, errors) {
    const failedFiles = modules.filter((module) => module.state() === "failed").length;
    console.log(`AND OS regression: TOTAL=${this.counts.total} PASS=${this.counts.pass} KNOWN_FAILURE=${this.counts.knownFailure} UNEXPECTED_FAIL=${this.counts.fail} SKIPPED=${this.counts.skipped} FAILED_FILES=${failedFiles} UNHANDLED_ERRORS=${errors.length}`);
  }
}
