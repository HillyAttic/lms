"use server";

import { adminAuth, adminDb, FieldValue, serializeTimestamps } from "@/lib/firebase-admin";
import {
  getLaunchableItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

/**
 * Enrolling is what makes a repository upload one of a learner's courses, so
 * both it and the wishlist are keyed by the public course slug — the same key
 * `/courses/[slug]` uses. One document per learner per slug, and the id is
 * derived rather than random so neither list can collect duplicates.
 */
const keyFor = (uid: string, slug: string) => `${uid}_${slug}`;

/** Everything the learner routes read, taken from the verified token — never the caller. */
async function requireLearner(idToken: string) {
  const { uid } = await adminAuth.verifyIdToken(idToken);
  const profile = await adminDb.doc(`users/${uid}`).get();
  const data = profile.data();

  return { uid, name: data?.displayName || data?.email?.split("@")[0] || "Learner" };
}

/** Write or delete a `{uid}_{slug}` doc and report the state it ended in. */
async function setFlag(
  collection: "enrollments" | "wishlists",
  idToken: string,
  slug: string,
  on: boolean
) {
  const { uid } = await requireLearner(idToken);
  const ref = adminDb.doc(`${collection}/${keyFor(uid, slug)}`);

  if (on) {
    await ref.set({ userId: uid, slug, createdAt: FieldValue.serverTimestamp() });
  } else {
    await ref.delete();
  }

  return { success: true, active: on };
}

export async function setEnrollment(idToken: string, slug: string, on: boolean) {
  try {
    return await setFlag("enrollments", idToken, slug, on);
  } catch (error: any) {
    console.error("Set enrollment error:", error);
    return { success: false, error: error.message };
  }
}

export async function setWishlist(idToken: string, slug: string, on: boolean) {
  try {
    return await setFlag("wishlists", idToken, slug, on);
  } catch (error: any) {
    console.error("Set wishlist error:", error);
    return { success: false, error: error.message };
  }
}

/** The two flags the course detail page renders its buttons from. */
export async function getLearnerCourseState(idToken: string | null, slug: string) {
  try {
    if (!idToken) {
      return { success: true as const, data: { enrolled: false, wishlisted: false } };
    }
    const { uid } = await adminAuth.verifyIdToken(idToken);
    const [enrollment, wishlist] = await Promise.all([
      adminDb.doc(`enrollments/${keyFor(uid, slug)}`).get(),
      adminDb.doc(`wishlists/${keyFor(uid, slug)}`).get(),
    ]);
    return {
      success: true as const,
      data: { enrolled: enrollment.exists, wishlisted: wishlist.exists },
    };
  } catch (error: any) {
    console.error("Get learner course state error:", error);
    return {
      success: false as const,
      error: error.message,
      data: { enrolled: false, wishlisted: false },
    };
  }
}

export type LearnerCourse = {
  slug: string;
  /** Repository item id — the key a `progress` record is written under. */
  id: string;
  name: string;
  thumbnailUrl: string | null;
  type: RepositoryContentItem["type"];
  savedAt: number;
  /** The `progress` record for this course, or null if it was never launched. */
  progress: CourseProgress | null;
};

export type CourseProgress = {
  status: string;
  score: number | null;
  lastUpdated: { seconds: number; nanoseconds: number } | null;
};

type SavedSlug = { slug: string; savedAt: number };

/**
 * The saved slugs for one learner. `collection().where()` on a single field
 * needs no composite index; the doc id is `{uid}_{slug}`, which already orders
 * a learner's own docs, and the newest-first sort happens here.
 */
async function readLists(uid: string) {
  const [enrollments, wishlists] = await Promise.all([
    adminDb.collection("enrollments").where("userId", "==", uid).get(),
    adminDb.collection("wishlists").where("userId", "==", uid).get(),
  ]);

  const toList = (docs: typeof enrollments.docs): SavedSlug[] =>
    docs
      .map((doc) => ({
        slug: doc.data().slug as string,
        savedAt: doc.data().createdAt?.seconds || 0,
      }))
      .sort((a, b) => b.savedAt - a.savedAt);

  return { enrolled: toList(enrollments.docs), wishlist: toList(wishlists.docs) };
}

/** The public shape of both lists, for callers outside the dashboard. */
export async function getLearnerLists(idToken: string) {
  try {
    const { uid } = await requireLearner(idToken);
    return { success: true as const, data: await readLists(uid) };
  } catch (error: any) {
    console.error("Get learner lists error:", error);
    return {
      success: false as const,
      error: error.message,
      data: { enrolled: [] as SavedSlug[], wishlist: [] as SavedSlug[] },
    };
  }
}

/**
 * A saved slug names a repository item by its id — the same key the launch
 * routes and the progress records use. All three collections are read once
 * rather than once per saved course, so the cost does not grow with the length
 * of the learner's lists.
 */
async function loadCourses(
  saved: SavedSlug[],
  progressByCourseId: Map<string, CourseProgress>
): Promise<LearnerCourse[]> {
  const result = await getLaunchableItems();
  if (!result.success) return [];

  const items = new Map(
    (result.data as RepositoryContentItem[]).map((item) => [item.id, item])
  );

  const resolved = saved.flatMap(({ slug, savedAt }) => {
    const item = items.get(slug);
    if (!item) return [];
    return [
      {
        slug,
        id: item.id,
        name: item.name,
        thumbnailUrl: item.thumbnailUrl,
        type: item.type,
        savedAt,
        progress: progressByCourseId.get(item.id) ?? null,
      } satisfies LearnerCourse,
    ];
  });

  return serializeTimestamps(resolved) as LearnerCourse[];
}

/** A launch writes `status`; a completing one also carries a score. */
const COMPLETED = ["completed", "passed"];

/**
 * Everything the learner dashboard shows in one round trip: the three headline
 * counts, the shares the ring draws, and the three lists. Progress is keyed by
 * repository item id while the lists are keyed by slug, so each saved course is
 * resolved to its item once and the ids are matched from there.
 */
export async function getLearnerDashboard(idToken: string) {
  const empty = {
    name: "",
    enrolled: [] as LearnerCourse[],
    wishlist: [] as LearnerCourse[],
    certificates: [] as LearnerCourse[],
    stats: { enrolled: 0, certificates: 0, wishlist: 0 },
  };

  try {
    const { uid, name } = await requireLearner(idToken);
    const [lists, progress] = await Promise.all([
      readLists(uid),
      adminDb.collection("progress").where("userId", "==", uid).get(),
    ]);

    const progressByCourseId = new Map(
      progress.docs.map((doc) => {
        const data = doc.data();
        return [
          data.courseId as string,
          {
            status: (data.status as string) || "incomplete",
            score: typeof data.score === "number" ? data.score : null,
            lastUpdated: serializeTimestamps(data.lastUpdated),
          } satisfies CourseProgress,
        ];
      })
    );

    const [enrolled, wishlist] = await Promise.all([
      loadCourses(lists.enrolled, progressByCourseId),
      loadCourses(lists.wishlist, progressByCourseId),
    ]);
    // The progress record is the certificate: a launch abandoned halfway has a
    // status but is neither a finished course nor an award.
    const certificates = enrolled.filter(
      (course) =>
        course.type === "scorm" && COMPLETED.includes(course.progress?.status || "")
    );

    return {
      success: true as const,
      data: {
        name,
        enrolled,
        wishlist,
        certificates,
        stats: {
          enrolled: enrolled.length,
          certificates: certificates.length,
          wishlist: wishlist.length,
        },
      },
    };
  } catch (error: any) {
    console.error("Get learner dashboard error:", error);
    return { success: false as const, error: error.message, data: empty };
  }
}

export type LeaderboardRow = {
  id: string;
  userName: string;
  courseName: string;
  type: string;
  score: number;
};

/**
 * Every learner's highest score per course, newest record first. SCORM packages
 * hold the only real score in the system, so video and game courses can only
 * supply the row once a launch has written one — until then a course contributes
 * nothing to the board rather than a zero-score row. Staff accounts are left out
 * so the board reads as learners only.
 */
export async function getLeaderboardRows() {
  try {
    const [progress, users, publicCourses, scorm, video, game] = await Promise.all([
      adminDb.collection("progress").get(),
      adminDb.collection("users").get(),
      adminDb.collection("public_courses").get(),
      adminDb.collection("repository").get(),
      adminDb.collection("video_courses").get(),
      adminDb.collection("game_courses").get(),
    ]);

    // A progress record is keyed by repository item id, but the name a learner
    // sees comes from `public_courses` when a record exists there. Video and
    // game courses have no public record yet, so their own titles stand in.
    const fallback = new Map<string, { name: string; type: string }>();
    const remember = (docs: typeof scorm.docs, type: string) =>
      docs.forEach((doc) => {
        const data = doc.data();
        fallback.set(doc.id, { name: data.name || data.title || doc.id, type });
      });
    remember(scorm.docs, "scorm");
    remember(video.docs, "video");
    remember(game.docs, "game");
    const slugs = new Map(
      publicCourses.docs.map((doc) => [doc.id, doc.data().title || doc.data().slug || doc.id])
    );

    const profiles = new Map(
      users.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            name: data.displayName || data.email?.split("@")[0] || "Learner",
            staff: data.role === "admin" || data.role === "manager",
          },
        ];
      })
    );

    // A learner may have launched the same course more than once; only their
    // best attempt belongs on the board.
    const best = new Map<string, { userId: string; courseId: string; score: number; seconds: number }>();
    progress.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.userId || !data.courseId) return;
      const score = typeof data.score === "number" ? data.score : 0;
      const seconds = data.lastUpdated?.seconds || 0;
      const key = `${data.userId}_${data.courseId}`;
      const existing = best.get(key);
      if (!existing || score > existing.score || (score === existing.score && seconds > existing.seconds)) {
        best.set(key, { userId: data.userId, courseId: data.courseId, score, seconds });
      }
    });

    const rows: LeaderboardRow[] = [];
    const newestFirst = [...best.values()].sort((a, b) => b.seconds - a.seconds);
    for (const { userId, courseId, score } of newestFirst) {
      const profile = profiles.get(userId);
      // A staff account's own progress would read as a junk row to every
      // learner, so the board is learners only.
      if (profile?.staff) continue;

      rows.push({
        id: String(rows.length + 1),
        userName: profile?.name || "Learner",
        courseName: slugs.get(courseId) || fallback.get(courseId)?.name || courseId,
        type: fallback.get(courseId)?.type || "scorm",
        score,
      });
    }

    return { success: true, data: rows };
  } catch (error: any) {
    console.error("Get leaderboard rows error:", error);
    return { success: false, error: error.message, data: [] as LeaderboardRow[] };
  }
}
