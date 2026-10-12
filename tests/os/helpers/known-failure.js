import { beforeEach, describe, test } from "vitest";

export function regressionTest(id, title, reproduce, assertInvariant) {
  test(`[${id}] ${title}`, async () => assertInvariant(await reproduce()));
}

export function knownFailure(id, title, reproduce, assertInvariant) {
  describe(`[${id}] ${title}`, () => {
    let evidence;
    // Import, fixture preparation and reproduction errors must fail normally.
    beforeEach(async () => {
      evidence = await reproduce();
    });
    test.fails("KNOWN FAILURE: target invariant", () => assertInvariant(evidence));
  });
}
