/**
 * Lifts the aggregate maths out of the `submitRating` server action and runs it
 * against forked rating histories — the arithmetic is what the stored average
 * and the star row depend on. Run with `node scripts/check-rating-aggregate.mjs`.
 */
import { readFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync("src/app/actions/public-course-actions.ts", "utf8");
// Every top-level helper the two lifted functions call, in source order.
const lifted = ["aggregateRating", "resolveRatingTarget", "getCourseReviews"]
  .map((name) => src.match(new RegExp(`async function ${name}[\\s\\S]*?\\n}`))[0])
  .join("\n");
const js = ts.transpileModule(lifted, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

const ratingDocs = [];
// Slugs named here resolve to a `public_courses` doc; anything else falls
// through to the repository branch, which exists only for the review cases.
const COURSE_SLUG = "a-course";
// `resolveRatingTarget` reads the slug off the snapshot it is handed.
const courseSnapshot = {
  empty: false,
  docs: [{ id: "course-1", data: () => ({ slug: COURSE_SLUG }) }],
};
// COLLECTION is a module-level const the lifted helpers close over; the
// harness supplies it rather than the source.
const { aggregateRating, getCourseReviews } = new Function(
  "adminDb",
  "COLLECTION",
  "serializeTimestamps",
  `${js}; return { aggregateRating, getCourseReviews };`,
)(
  {
    collection: () => ({
      where: (field, _op, value) => ({
        // The slug lookup is the one query that must find a course; every
        // other `.where()` is a ratings query over the docs under test.
        limit: () => ({
          get: async () =>
            field === "slug" && value === COURSE_SLUG
              ? courseSnapshot
              : { empty: true, docs: [], size: 0 },
        }),
        get: async () => ({
          empty: ratingDocs.length === 0,
          size: ratingDocs.length,
          docs: ratingDocs,
        }),
      }),
      doc: () => ({ get: async () => ({ exists: false }) }),
    }),
  },
  "public_courses",
  // Pass-through is enough — the shape is already plain in these fixtures.
  (value) => value,
);

const check = async (label, values, expected) => {
  ratingDocs.length = 0;
  values.forEach((value) => ratingDocs.push({ data: () => ({ value }) }));
  const actual = await aggregateRating("course", "x");
  const ok = actual.average === expected.average && actual.count === expected.count;
  console.log(
    `${ok ? "PASS" : "FAIL"} ${label}: rating ${actual.average} count ${actual.count}`,
  );
  if (!ok) process.exitCode = 1;
};

await check("no ratings", [], { average: 0, count: 0 });
await check("single rater", [5], { average: 5, count: 1 });
await check("rounds to one decimal", [4, 5, 5], { average: 4.7, count: 3 });
await check("4.5 stays exact", [4, 5], { average: 4.5, count: 2 });
await check("all ones", [1, 1, 1, 1], { average: 1, count: 4 });
await check("sum does not drift", [5, 4, 4, 4, 4, 4], { average: 4.2, count: 6 });

const checkReviews = async (label, docs, expected) => {
  ratingDocs.length = 0;
  docs.forEach((rating) => ratingDocs.push({ data: () => rating }));
  const result = await getCourseReviews(COURSE_SLUG);
  const actual = result.data.map((review) => review.comment);
  // Assert `success` too: the error path also returns an empty list, so
  // checking the list alone would pass a query that never ran.
  const ok =
    result.success && JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: ${JSON.stringify(actual)}`);
  if (!ok) process.exitCode = 1;
};

await checkReviews("stars only are hidden", [
  { value: 5, userId: "u1", updatedAt: { seconds: 10 } },
], []);
await checkReviews("blank reviews are hidden", [
  { value: 5, userId: "u1", comment: "   ", updatedAt: { seconds: 10 } },
], []);
await checkReviews("newest review first", [
  { value: 4, userId: "u1", comment: "older", updatedAt: { seconds: 10 } },
  { value: 5, userId: "u2", comment: "newer", updatedAt: { seconds: 20 } },
], ["newer", "older"]);
await checkReviews("legacy rating with no timestamp sorts last", [
  { value: 5, userId: "u1", comment: "no stamp" },
  { value: 5, userId: "u2", comment: "stamped", updatedAt: { seconds: 5 } },
], ["stamped", "no stamp"]);
ratingDocs.length = 0;
ratingDocs.push({
  data: () => ({ value: 5, userId: "u1", comment: "hi", updatedAt: null }),
});
const fallbackResult = await getCourseReviews(COURSE_SLUG);
const fallback = fallbackResult.data;
const nameOk = fallbackResult.success && fallback[0]?.userName === "Learner";
console.log(`${nameOk ? "PASS" : "FAIL"} missing userName falls back: ${fallback[0]?.userName}`);
if (!nameOk) process.exitCode = 1;
