import MotionHome from "./MotionHome";

/* The layout is read on the server so it is in the initial HTML: a client hook
 * left the first paint blank until the JS bundle downloaded. */
export default function Home() {
  return <MotionHome />;
}
