/**
 * The palette is fixed per category and never follows rank — filtering one row
 * out must not repaint the others. The three hues clear the colour-blind
 * separation and normal-vision gates as a set against the white card, and the
 * legend labels every segment, so identity is never carried by colour alone.
 */
const SERIES = [
  { key: "enrolled", label: "Enrolled", color: "#2a78d6" },
  { key: "certificates", label: "Certificates", color: "#1baf7a" },
  { key: "wishlist", label: "Wishlist", color: "#eb6834" },
] as const;

const RADIUS = 70;
const THICKNESS = 20;
/** Surface-coloured gap between arcs, so touching segments stay distinct. */
const GAP = 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Stats = { enrolled: number; certificates: number; wishlist: number };

const LearningProgress = ({ stats }: { stats: Stats }) => {
  const total = stats.enrolled + stats.certificates + stats.wishlist;

  // Offsets accumulate around the ring; each arc is drawn from where the last
  // one ended, so a zero-value segment simply takes no space.
  const arcs = SERIES.map((series, index) => {
    const value = stats[series.key];
    const length = total > 0 ? (value / total) * CIRCUMFERENCE : 0;
    const offset = SERIES.slice(0, index).reduce(
      (sum, previous) =>
        sum + (total > 0 ? (stats[previous.key] / total) * CIRCUMFERENCE : 0),
      0,
    );
    return { ...series, value, length: Math.max(length - GAP, 0), offset };
  });

  return (
    <div className="mt-4 rounded-2xl bg-gray-50 p-6">
      {total === 0 ? (
        <p className="py-10 text-center text-secondary">
          Nothing here yet — enroll in a course to start tracking your progress.
        </p>
      ) : (
        <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-14">
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label={`Learning progress: ${SERIES.map((s) => `${stats[s.key]} ${s.label}`).join(", ")}`}
            className="size-45 shrink-0"
          >
            {/* Only the ring turns; the count in the middle stays upright. */}
            <g fill="none" strokeWidth={THICKNESS} transform="rotate(-90 100 100)">
              <circle cx="100" cy="100" r={RADIUS} stroke="#e1e4ea" />
              {arcs.map((arc) =>
                arc.value === 0 ? null : (
                  <circle
                    key={arc.key}
                    cx="100"
                    cy="100"
                    r={RADIUS}
                    stroke={arc.color}
                    strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
                    strokeDashoffset={-arc.offset}
                    className="transition-opacity hover:opacity-80"
                  >
                    <title>{`${arc.label}: ${arc.value}`}</title>
                  </circle>
                ),
              )}
            </g>
            <text
              x="100"
              y="98"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-900 text-3xl font-bold"
            >
              {total}
            </text>
            <text
              x="100"
              y="120"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-500 text-xs"
            >
              Total
            </text>
          </svg>

          <ul className="w-full max-w-xs space-y-4">
            {SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-3">
                <span
                  className="size-3.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: series.color }}
                />
                <span className="text-secondary">{series.label}</span>
                <span className="ml-auto font-semibold text-gray-900">
                  {stats[series.key]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {total > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-secondary">
            View as a table
          </summary>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th scope="col" className="py-1.5 font-medium">Metric</th>
                <th scope="col" className="py-1.5 text-right font-medium">Count</th>
                <th scope="col" className="py-1.5 text-right font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {SERIES.map((series) => (
                <tr key={series.key} className="border-t border-gray-200">
                  <th scope="row" className="py-1.5 text-left font-normal text-gray-900">
                    {series.label}
                  </th>
                  <td className="py-1.5 text-right tabular-nums text-gray-900">
                    {stats[series.key]}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-gray-500">
                    {Math.round((stats[series.key] / total) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
};

export default LearningProgress;
