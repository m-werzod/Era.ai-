import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, ChevronRight, ChevronUp, Loader2, Minus } from "lucide-react";
import type { GenerationTask } from "@/entities/generation-task";
import { useLocation, useNavigate } from "@/shared/routing";
import { ModelGlyph } from "@/shared/ui/era";
import { cn } from "@/shared/lib/utils";
import { selectActiveTasks, selectSummary } from "../model/selectors";
import { useQueueState } from "../model/useQueue";
import { pluralize } from "../lib/formatEta";
import { ProgressBar } from "./ProgressBar";

const QUEUE_PATH = "/queue";
const MINI_LIST_LIMIT = 3;
/**
 * Routes where the floating bar is suppressed (redundant or chrome-less).
 * The four workspace pages already show their own inline GenerationLoader
 * pinned above the composer — the floating bar rendered full-width on top
 * of that same composer on mobile (it sits `fixed inset-x-0 bottom-0`),
 * blocking the Generate button behind an unrelated card.
 */
const HIDDEN_PATHS = new Set([QUEUE_PATH, "/auth", "/text", "/design", "/video", "/audio"]);

const generationsWord = (n: number): string =>
  pluralize(n, ["генерация", "генерации", "генераций"]);

/**
 * Floating, app-wide generation manager — like a browser's download manager.
 * Reads the same queue store as the page (single source of truth), so its
 * counters and progress always match. Hidden when there's nothing active and
 * on the queue page itself (where it would be redundant).
 */
export function GenerationStatusBar() {
  const { tasks, phase } = useQueueState();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const summary = useMemo(() => selectSummary(tasks), [tasks]);
  const active = useMemo(() => selectActiveTasks(tasks), [tasks]);

  const visible = phase === "ready" && summary.activeCount > 0 && !HIDDEN_PATHS.has(pathname);

  // Reset to the expanded view once the bar goes away, so it re-appears open.
  useEffect(() => {
    if (!visible && collapsed) setCollapsed(false);
  }, [visible, collapsed]);

  const openQueue = () => navigate(QUEUE_PATH);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end px-4 pb-4 safe-bottom",
        "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:px-0 sm:pb-0",
      )}
    >
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {visible && (
            <motion.div
              key="status-bar"
              layout
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto w-full sm:w-[360px]"
            >
              {collapsed ? (
                <CollapsedPill
                  count={summary.activeCount}
                  percent={summary.averageProgress}
                  onExpand={() => setCollapsed(false)}
                />
              ) : summary.activeCount === 1 ? (
                <CompactCard task={active[0]} onOpen={openQueue} />
              ) : (
                <ExpandedCard
                  tasks={active}
                  activeCount={summary.activeCount}
                  runningCount={summary.runningCount}
                  queuedCount={summary.queuedCount}
                  percent={summary.averageProgress}
                  onOpen={openQueue}
                  onCollapse={() => setCollapsed(true)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}

const CARD_BASE =
  "rounded-2xl border border-[hsl(var(--border))] bg-popover shadow-[var(--shadow-2)]";

function SpinnerTile({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
    </span>
  );
}

function CompactCard({ task, onOpen }: { task: GenerationTask; onOpen: () => void }) {
  const isRunning = task.status === "running";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        CARD_BASE,
        "group flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/40",
      )}
      aria-label="Открыть очередь генераций"
    >
      <SpinnerTile />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">{task.modelName}</span>
          <span className="shrink-0 font-mono text-[12px] tabular-nums text-muted-foreground">
            {isRunning ? `${Math.round(task.progress)}%` : "в очереди"}
          </span>
        </div>
        <ProgressBar value={task.progress} animated={isRunning} className="mt-1.5" />
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </button>
  );
}

interface ExpandedCardProps {
  tasks: GenerationTask[];
  activeCount: number;
  runningCount: number;
  queuedCount: number;
  percent: number;
  onOpen: () => void;
  onCollapse: () => void;
}

function ExpandedCard({
  tasks,
  activeCount,
  runningCount,
  queuedCount,
  percent,
  onOpen,
  onCollapse,
}: ExpandedCardProps) {
  return (
    <div className={cn(CARD_BASE, "p-3.5")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SpinnerTile />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Генерации идут</p>
            <p className="text-[12px] text-muted-foreground">
              {runningCount > 0 && `${runningCount} идёт`}
              {runningCount > 0 && queuedCount > 0 && " · "}
              {queuedCount > 0 && `${queuedCount} в очереди`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="min-w-[2.75rem] text-right font-mono text-sm font-semibold tabular-nums text-foreground">
            {percent}%
          </span>
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Свернуть"
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>

      <ProgressBar
        value={percent}
        animated
        className="mt-2.5"
        aria-label={`Общий прогресс: ${percent}%`}
      />

      <ul className="mt-3 space-y-2.5">
        {tasks.slice(0, MINI_LIST_LIMIT).map((task) => (
          <MiniItem key={task.id} task={task} />
        ))}
      </ul>

      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-accent"
      >
        Открыть очередь
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}

function MiniItem({ task }: { task: GenerationTask }) {
  const isRunning = task.status === "running";
  return (
    <li className="flex items-center gap-2.5">
      <ModelGlyph name={task.modelName} size={28} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[12px] text-foreground/85">{task.modelName}</span>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
            {isRunning ? `${Math.round(task.progress)}%` : "в очереди"}
          </span>
        </div>
        <ProgressBar value={task.progress} animated={isRunning} className="mt-1" />
      </div>
    </li>
  );
}

interface CollapsedPillProps {
  count: number;
  percent: number;
  onExpand: () => void;
}

function CollapsedPill({ count, percent, onExpand }: CollapsedPillProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        CARD_BASE,
        "ml-auto flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-colors hover:border-primary/40",
      )}
      aria-label="Развернуть статус генераций"
    >
      <Loader2 className="size-4 shrink-0 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
      <span className="text-[13px] font-medium text-foreground">
        {count} {generationsWord(count)} · {percent}%
      </span>
      <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
