import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ModelGlyph } from "@/shared/ui/era/ModelGlyph";

export interface WelcomeScenario {
  Icon: LucideIcon;
  title: string;
  desc: string;
  prompt: string;
  providerId?: string;
  subModelId?: string;
  aspect?: string;
  quality?: string;
  quantity?: number;
  duration?: string;
  resolution?: string;
}

interface Props {
  modelName: string;
  subModelName?: string;
  description?: string;
  scenarios: WelcomeScenario[];
  onScenarioClick: (scenario: WelcomeScenario) => void;
}

const CARD_GRADIENTS = [
  "linear-gradient(135deg, rgba(232,84,32,0.15) 0%, rgba(255,122,61,0.05) 100%)",
  "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.05) 100%)",
  "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.05) 100%)",
  "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.05) 100%)",
  "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(217,119,6,0.05) 100%)",
  "linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.05) 100%)",
];

const ICON_COLORS = [
  { bg: "rgba(232,84,32,0.12)", color: "hsl(var(--primary))" },
  { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
  { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
  { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" },
  { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  { bg: "rgba(236,72,153,0.12)", color: "#f472b6" },
];

export function WelcomeBlock({
  modelName,
  subModelName,
  description = "Единый доступ к 90+ нейросетям",
  scenarios,
  onScenarioClick,
}: Props) {
  const cards = scenarios.slice(0, 6);

  return (
    <div className="flex flex-col items-center px-4 py-10 min-h-[calc(100dvh-var(--header-height,64px)-200px)]">
      {/* ── Model hero ── */}
      <motion.div
        className="relative flex items-center justify-center mb-5"
        initial={{ opacity: 0, scale: 0.75, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glow halo */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 140,
            height: 140,
            background:
              "radial-gradient(circle, rgba(232,84,32,0.22) 0%, transparent 70%)",
          }}
        />
        <ModelGlyph name={modelName} size={68} />
      </motion.div>

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4 }}
      >
        <h1
          className="text-[26px] font-bold tracking-tight mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          {modelName}
        </h1>
        {subModelName && (
          <p
            className="text-[13px] font-mono tabular-nums mb-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subModelName}
          </p>
        )}
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {description}
        </p>
      </motion.div>

      {/* ── Scenario cards grid ── */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-[580px]"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.07, delayChildren: 0.22 } },
        }}
      >
        {cards.map((s, i) => {
          const grad = CARD_GRADIENTS[i % CARD_GRADIENTS.length];
          const ic = ICON_COLORS[i % ICON_COLORS.length];
          return (
            <motion.button
              key={s.title}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.93 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ y: -4, scale: 1.03, transition: { duration: 0.18 } }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onScenarioClick(s)}
              className="group relative flex flex-col items-start text-left p-4 rounded-2xl overflow-hidden transition-shadow hover:shadow-xl"
              style={{
                background: grad,
                border: "1px solid var(--border-primary)",
                backdropFilter: "blur(6px)",
              }}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background: ic.bg }}
              >
                <s.Icon
                  className="w-[18px] h-[18px]"
                  style={{ color: ic.color }}
                />
              </div>

              <span
                className="text-[13px] font-semibold leading-tight mb-0.5"
                style={{ color: "var(--text-primary)" }}
              >
                {s.title}
              </span>
              <span
                className="text-[11px] leading-snug line-clamp-2"
                style={{ color: "var(--text-tertiary)" }}
              >
                {s.desc}
              </span>

              {/* Arrow hint on hover */}
              <span
                className="absolute bottom-3 right-3 text-[11px] opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ color: ic.color }}
              >
                →
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
