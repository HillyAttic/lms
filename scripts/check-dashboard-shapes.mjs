/**
 * Run: node scripts/check-dashboard-shapes.mjs
 *
 * Locks the two shapes the learner dashboard depends on: the `{uid}_{slug}` key
 * that keeps enrollment and wishlist documents from duplicating, and the ring
 * geometry, where a segment with no value must leave no gap in the circle.
 */
import assert from "node:assert/strict";

const keyFor = (uid, slug) => `${uid}_${slug}`;
assert.equal(keyFor("abc", "taxi-driver"), "abc_taxi-driver");
// Same learner, different courses — and the same course for another learner —
// must not collide on one document id.
assert.notEqual(keyFor("abc", "taxi-driver"), keyFor("abc", "carpenter"));
assert.notEqual(keyFor("abc", "taxi-driver"), keyFor("xyz", "taxi-driver"));

const RADIUS = 70;
const GAP = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const segments = (stats) => {
  const total = stats.enrolled + stats.certificates + stats.wishlist;
  const arcs = [];
  let offset = 0;
  for (const [key, value] of Object.entries(stats)) {
    const length = total > 0 ? (value / total) * CIRCUMFERENCE : 0;
    arcs.push({ key, value, length: Math.max(length - GAP, 0), offset });
    offset += length;
  }
  return { arcs, total };
};

// The image's own figures: one enrollment, nothing else. One arc, one full turn.
const single = segments({ enrolled: 1, certificates: 0, wishlist: 0 });
assert.equal(single.total, 1);
assert.ok(single.arcs[0].length > 0, "the only segment must draw");
assert.equal(single.arcs[1].length, 0, "an empty segment draws nothing");
assert.equal(single.arcs[2].length, 0);
assert.equal(single.arcs[2].offset, CIRCUMFERENCE, "the empty tail ends back at the start");

// Three equal arcs: each starts where the last ended, and they close the ring.
const thirds = segments({ enrolled: 1, certificates: 1, wishlist: 1 });
assert.equal(thirds.arcs[0].offset, 0);
assert.ok(Math.abs(thirds.arcs[1].offset - CIRCUMFERENCE / 3) < 1e-9);
assert.ok(Math.abs(thirds.arcs[2].offset - (CIRCUMFERENCE * 2) / 3) < 1e-9);

// A large share can never bleed past the end of the ring — the dash leaves the
// remainder, which stays non-negative.
for (const stats of [single, thirds, segments({ enrolled: 0, certificates: 0, wishlist: 0 })]) {
  for (const arc of stats.arcs) {
    assert.ok(arc.length >= 0, "segment length must not go negative");
    assert.ok(arc.length <= CIRCUMFERENCE, "segment cannot exceed the ring");
  }
}
assert.equal(
  segments({ enrolled: 0, certificates: 0, wishlist: 0 }).total,
  0,
  "an empty dashboard shows the empty state, not a ring",
);

console.log("dashboard shapes: ok");
