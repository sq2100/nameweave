import test from "node:test";
import assert from "node:assert/strict";
import { renamePlan } from "../src/core.js";
const files = (names) => names.map((name) => ({ name, size: 3 }));
test("literal replacements preserve extension and sequence order", () => {
  const p = renamePlan(files(["IMG_A.JPG", "IMG_B.JPG"]), {
    prefix: "trip_",
    find: "IMG_",
    replace: "",
    start: 8,
    digits: 3,
    mode: "lower",
  });
  assert.deepEqual(
    p.map((r) => r.name),
    ["trip_008_a.JPG", "trip_009_b.JPG"],
  );
});
test("detects case-insensitive collisions after transformation", () => {
  const p = renamePlan(files(["A.txt", "a.txt"]), { sequence: false });
  assert.ok(p.every((r) => r.error.includes("collision")));
});
test("blocks traversal, reserved names, invalid padding and separator injection", () => {
  for (const prefix of ["../", "a/", "a\\"])
    assert.ok(renamePlan(files(["x"]), { prefix })[0].error);
  assert.ok(renamePlan(files(["CON.txt"]), { sequence: false })[0].error);
  assert.throws(() => renamePlan(files(["a"]), { digits: 0 }));
});
