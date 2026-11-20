"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  getRepositoryItems,
  type RepositoryContentItem,
  type RepositoryContentType,
} from "@/app/actions/repository-actions";
import { checkRepositoryAccess } from "@/app/actions/user-actions";
import Input from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Play,
  RefreshCw,
  LayoutDashboard,
  FileStack,
  Video,
  GamepadIcon,
  Clock,
  GraduationHat,
  LongArrowUpRight,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

type RepositoryItem = RepositoryContentItem;

const TYPE_LABELS: Record<RepositoryContentType, string> = {
  scorm: "SCORM",
  video: "Video",
  game: "Game",
};

const TYPE_ICONS: Record<RepositoryContentType, typeof FileStack> = {
  scorm: FileStack,
  video: Video,
  game: GamepadIcon,
};

const LEVELS = [
  { value: "", label: "All levels" },
  { value: "1", label: "Level 1 — Read only" },
  { value: "2", label: "Level 2 — Limited" },
  { value: "2.5", label: "Level 2.5 — Complex" },
  { value: "3", label: "Level 3 — Full simulation" },
];

/*
 * The repository carries eight fields per item, so both a dense table and a
 * card grid are useful: cards are the default (the library read), and the table
 * stays one click away for comparing rows. Both render the same filtered list
 * and call the same `handleLaunch`, so nothing can drift between them.
 */
type View = "grid" | "table";

export default function RepositoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RepositoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<RepositoryContentType | "all">(
    "all",
  );
  const [view, setView] = useState<View>("grid");
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const result = await getRepositoryItems();
      if (result.success) {
        setItems(result.data as RepositoryItem[]);
      }
    } catch (error) {
      console.error("Failed to load repository items:", error);
    } finally {
      setLoading(false);
    }
  };

  /* `function` declarations, not consts: both are referenced by the effect
     above, and hoisting keeps it from reading an uninitialised binding. */
  async function getRepositoryAccess() {
    if (!user) return;

    const result = await checkRepositoryAccess(user.uid);
    if (result.success) {
      setHasAccess(result.hasAccess);
      if (result.hasAccess) {
        loadItems();
      } else {
        setLoading(false);
      }
    } else {
      setHasAccess(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // User not logged in, redirect to login
      router.push("/admin/login");
      return;
    }
    // The access check resolves asynchronously — the setState calls inside it
    // land after the await, not during this effect body.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void getRepositoryAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const handleLaunch = async (item: RepositoryItem) => {
    setLaunchingId(item.id);
    try {
      if (item.type === "video") {
        // Dedicated player page rather than the raw signed file.
        window.open(`/watch/${item.id}`, "_blank");
      } else if (item.type === "game") {
        window.open(item.gameUrl || `/api/game/launch/${item.id}`, "_blank");
      } else {
        // Open via proxy route — hides signed URL, serves all assets cleanly
        window.open(
          `/api/repository/launch/${item.id}/${item.entryPoint || "story.html"}`,
          "_blank",
        );
      }
    } catch (error) {
      console.error("Failed to launch course:", error);
      toast.error("Could not launch that course. Please try again.");
    } finally {
      setLaunchingId(null);
    }
  };

  const launchLabel = (item: RepositoryItem) =>
    item.type === "video" ? "Watch" : item.type === "game" ? "Play" : "Launch";

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.features?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel =
      filterLevel === null || item.interactivityLevel === filterLevel;
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesLevel && matchesType;
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (authLoading || loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
      </div>
    );
  }

  if (!user || hasAccess === false) {
    const denied = hasAccess === false;
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div className="max-w-md">
          <h1 className="display-3">
            {denied ? "Access " : "Sign in "}
            <span className="marker">{denied ? "denied" : "required"}</span>
          </h1>
          <p className="mt-4 leading-7 text-secondary">
            {denied
              ? "Your account doesn't have repository access yet. Contact an administrator to get it enabled."
              : "Please log in to open the repository."}
          </p>
          <button
            type="button"
            onClick={() => router.push(denied ? "/" : "/admin/login")}
            className="mt-7 rounded-full border-[1.5px] border-ink bg-accent px-6 py-3 text-sm font-medium shadow-md transition-transform hover:-translate-y-0.5"
          >
            {denied ? "Go home" : "Log in"}
          </button>
        </div>
      </div>
    );
  }

  const hasFilters = Boolean(searchTerm || filterLevel !== null || filterType !== "all");

  return (
    <main className="bg-background pb-20 pt-12 sm:pt-16">
      <div className="container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink px-3 py-1">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase">
                Repository
              </span>
            </span>
            <h1 className="display-2 mt-5 text-balance">
              Your complete <span className="marker">library</span>
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-secondary text-pretty">
              Every SCORM module, video course and game available to your
              account. Launch any of them straight from here.
            </p>
          </div>

          {/* View switch */}
          <div
            role="group"
            aria-label="Change layout"
            className="inline-flex shrink-0 self-start rounded-full border-[1.5px] border-ink bg-white p-1 lg:self-auto"
          >
            {(["grid", "table"] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors",
                  view === v ? "bg-ink text-white" : "text-secondary hover:text-ink",
                )}
              >
                {v === "table" && <LayoutDashboard className="size-4" />}
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute top-1/2 left-4 z-10 size-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              aria-label="Search the repository"
              placeholder="Search courses…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11"
            />
          </div>

          {/* Type chips scroll on narrow screens instead of wrapping to a block. */}
          <div className="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-center gap-2">
              {(["all", "scorm", "video", "game"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={filterType === t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "rounded-full border-[1.5px] border-ink px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-colors",
                    filterType === t
                      ? "bg-ink text-white"
                      : "bg-white hover:bg-accent",
                  )}
                >
                  {t === "all" ? "All" : TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-56">
            <Select
              value={filterLevel === null ? "" : String(filterLevel)}
              onValueChange={(v) => setFilterLevel(v === "" ? null : parseFloat(v))}
            >
              <SelectTrigger aria-label="Filter by interactivity level">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p aria-live="polite" className="text-sm font-medium text-secondary lg:ml-auto">
            {filteredItems.length} of {items.length}
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="card-brutal mt-10 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold tracking-[-0.02em]">
              Nothing matches those filters
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-secondary">
              {hasFilters
                ? "Try a different type or level. Level only applies to SCORM modules."
                : "No courses have been added to the repository yet."}
            </p>
          </div>
        ) : view === "grid" ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <RepositoryCard
                key={item.id}
                item={item}
                launching={launchingId === item.id}
                onLaunch={() => handleLaunch(item)}
                formatDuration={formatDuration}
              />
            ))}
          </ul>
        ) : (
          <RepositoryTable
            items={filteredItems}
            launchingId={launchingId}
            onLaunch={handleLaunch}
            launchLabel={launchLabel}
            formatDuration={formatDuration}
          />
        )}
      </div>
    </main>
  );
}

const TypeBadge = ({ type }: { type: RepositoryContentType }) => {
  const Icon = TYPE_ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.08em] text-accent uppercase">
      <Icon className="size-3.5" />
      {TYPE_LABELS[type]}
    </span>
  );
};

const RepositoryCard = ({
  item,
  launching,
  onLaunch,
  formatDuration,
}: {
  item: RepositoryItem;
  launching: boolean;
  onLaunch: () => void;
  formatDuration: (m: number) => string;
}) => (
  <li className="card-brutal card-brutal-hover group flex h-full flex-col overflow-hidden bg-white">
    <div className="p-2.5 pb-0">
      <div className="relative overflow-hidden rounded-[18px] border-[1.5px] border-ink/15">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            loading="lazy"
            className="aspect-16/10 w-full object-cover"
          />
        ) : (
          <span className="grid aspect-16/10 w-full place-items-center text-xs text-secondary">
            No preview
          </span>
        )}
        <span className="absolute top-3 left-3">
          <TypeBadge type={item.type} />
        </span>
      </div>
    </div>

    <div className="flex grow flex-col p-5">
      <h2 className="text-lg leading-7 font-bold tracking-[-0.02em] text-balance">
        {item.name}
      </h2>

      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-secondary">
        {item.serialNumber !== undefined && (
          <li>#{item.serialNumber}</li>
        )}
        {item.duration ? (
          <li className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {formatDuration(item.duration)}
          </li>
        ) : null}
        {item.interactivityLevel ? (
          <li className="flex items-center gap-1.5">
            <GraduationHat className="size-3.5" />
            Level {item.interactivityLevel}
          </li>
        ) : null}
      </ul>

      {item.description ? (
        <p className="mt-4 grow text-sm leading-6 text-secondary line-clamp-3">
          {item.description}
        </p>
      ) : (
        <div className="grow" />
      )}

      {item.features ? (
        <p className="mt-3 text-xs leading-5 text-gray-500 line-clamp-2">
          <span className="font-semibold uppercase tracking-[0.06em]">
            Features:{" "}
          </span>
          {item.features}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onLaunch}
        disabled={launching}
        className="mt-5 flex w-full items-center justify-between rounded-full border-[1.5px] border-ink bg-accent py-2.5 pr-2.5 pl-5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {launching ? "Opening…" : launchLabelFor(item)}
        <span className="grid size-8 place-items-center rounded-full bg-ink text-accent">
          {launching ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <LongArrowUpRight />
          )}
        </span>
      </button>
    </div>
  </li>
);

const launchLabelFor = (item: RepositoryItem) =>
  item.type === "video" ? "Watch video" : item.type === "game" ? "Play game" : "Launch module";

const RepositoryTable = ({
  items,
  launchingId,
  onLaunch,
  launchLabel,
  formatDuration,
}: {
  items: RepositoryItem[];
  launchingId: string | null;
  onLaunch: (item: RepositoryItem) => void;
  launchLabel: (item: RepositoryItem) => string;
  formatDuration: (m: number) => string;
}) => (
  <div className="mt-8 overflow-hidden rounded-[24px] border-[1.5px] border-ink bg-white">
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="border-b-[1.5px] border-ink bg-muted">
          <tr>
            {[
              "S.No",
              "Type",
              "Name",
              "Level",
              "Features",
              "Description",
              "Duration",
              "",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="px-4 py-3 text-left text-[0.6875rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b border-ink/10 last:border-0 hover:bg-muted/60"
            >
              <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                {item.serialNumber ?? "—"}
              </td>
              <td className="px-4 py-3">
                <TypeBadge type={item.type} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="h-12 w-20 shrink-0 rounded-lg border-[1.5px] border-ink/15 object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-0.5 text-xs text-secondary">
                      {item.type === "scorm"
                        ? `SCORM ${item.scormVersion}`
                        : item.type === "video"
                          ? "Video course"
                          : "Game course"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-secondary">
                {item.interactivityLevel ?? "—"}
              </td>
              <td className="max-w-40 px-4 py-3 text-sm text-secondary">
                <span className="line-clamp-2" title={item.features}>
                  {item.features || "—"}
                </span>
              </td>
              <td className="max-w-60 px-4 py-3 text-sm text-secondary">
                <span className="line-clamp-2" title={item.description}>
                  {item.description || "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-secondary whitespace-nowrap">
                {item.duration ? formatDuration(item.duration) : "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onLaunch(item)}
                  disabled={launchingId === item.id}
                  className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-accent px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {launchingId === item.id ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      {launchLabel(item)}
                    </>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
