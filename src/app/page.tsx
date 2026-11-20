import MotionHome from "./MotionHome";
import {
  getRepositoryItems,
  type RepositoryContentItem,
} from "@/app/actions/repository-actions";

/* The layout is read on the server so it is in the initial HTML: a client hook
 * left the first paint blank until the JS bundle downloaded. */
export default async function Home() {
  const result = await getRepositoryItems().catch(() => null);
  const courses = result?.success ? (result.data as RepositoryContentItem[]) : [];
  return <MotionHome courses={courses} />;
}
