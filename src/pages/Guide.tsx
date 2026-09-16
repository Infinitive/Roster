import { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import TagChip from '../components/ui/TagChip';
import RosterBrand from '../components/ui/RosterBrand';
import { CANONICAL_30_TAGS } from '../data/canonicalTags';
import { 
  FolderTree, 
  Tag as TagIcon, 
  Flame, 
  ShieldCheck, 
  Cpu, 
  Star,
  HardDrive,
  Compass,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const VIBES = [
  { name: 'Aggressive', desc: 'High physical intensity, force, pace, or relentless dynamic.' },
  { name: 'Worship', desc: 'Adoration, body worship, reverence, deep focus on physical presence.' },
  { name: 'Filthy', desc: 'Raw, uninhibited, unpolished, wet, intense bodily abandon.' },
  { name: 'Degrading', desc: 'Psychological or verbal humiliation, power submission, objectification.' },
  { name: 'Tender', desc: 'Intimate, emotional connection, warm kissing, affection.' },
  { name: 'Chaotic', desc: 'Unpredictable energy, rapid position shifts, multi-participant free-for-all.' },
  { name: 'Power', desc: 'Clear dominance hierarchy, control, command, and deliberate pacing.' },
  { name: 'Size-focused', desc: 'Centering physical mass, height contrast, or anatomical extremes.' },
];

const RATINGS = [
  { level: 5, label: 'Nuclear / peak session', desc: 'Peak intensity. Complete physical or mental absorption. Instant leader.' },
  { level: 4, label: 'Very strong', desc: 'High quality encounter. Delivered exactly what was needed with strong momentum.' },
  { level: 3, label: 'Solid', desc: 'Reliable, good execution, hit the target without being extraordinary.' },
  { level: 2, label: 'Meh', desc: 'Underwhelming pace, chemistry mismatch, or didn’t hold focus.' },
  { level: 1, label: 'Skip / misfire', desc: 'Complete misfire. Would rather have skipped entirely.' },
];

const ORGASM_STATUSES = [
  { status: 'Came', desc: 'Full release achieved during the rotation.' },
  { status: 'Edged Only', desc: 'Brought close repeatedly without final release.' },
  { status: 'Both', desc: 'Extended edging phases followed by definitive release.' },
  { status: 'Neither', desc: 'Exploratory, paused, or ended without climax.' },
];

const DISCOVERY_MODES = [
  { name: 'Surprise Me', intent: 'Balanced Pull', desc: 'A curated mix balancing proven favorites and novelty across under-explored areas.' },
  { name: 'Blind Pull', intent: 'Zero Preconceptions', desc: 'Direct, unbiased pull across the entire archive with no filters or weights.' },
  { name: 'High Signal', intent: 'Peak Execution', desc: 'Pulls strictly from ★4–5 rated records and performers with proven satisfaction.' },
  { name: 'Unwatched', intent: 'Fresh Territory', desc: 'Surfaces videos with zero logged sessions. Great for working through new acquisitions.' },
  { name: 'Rediscover', intent: 'Forgotten Gems', desc: 'Finds videos you enjoyed previously but haven’t returned to in over 30 days.' },
  { name: 'Deep Cut', intent: 'Hidden Depth', desc: 'Unearthed records buried deep inside larger folder hierarchies or multi-performer folders.' },
  { name: 'Old Favorite', intent: 'Comfort Pull', desc: 'Your most repeated, reliable anchor videos with consistent historical performance.' },
  { name: 'Category Explorer', intent: 'Focused Search', desc: 'Pins to a specific folder, canonical tag, or vibe to explore that exact dimension.' },
  { name: 'Gap Explorer', intent: 'Counter-Programming', desc: 'Identifies themes, vibes, or performers that are underrepresented in your recent history.' },
  { name: 'True Random', intent: 'Pure Chance', desc: 'Completely unweighted shuffle without behavioral bias.' },
];

const DATA_STATUSES = [
  {
    badge: 'Verified Physical',
    color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    desc: 'Exact filename and relative folder path confirmed against your local storage.'
  },
  {
    badge: 'Research Needed',
    color: 'bg-amber-950/60 text-amber-300 border-amber-800',
    desc: 'Performers or metadata are unresolved or marked with unknown handles.'
  },
  {
    badge: 'Manual Review',
    color: 'bg-blue-950/60 text-blue-300 border-blue-800',
    desc: 'Metadata has been manually inspected, refined, and locked by you.'
  },
  {
    badge: 'Folder / Count Mismatch',
    color: 'bg-rose-950/60 text-rose-300 border-rose-800',
    desc: 'Discrepancy detected between physical folder path (e.g. Solo) and extracted performers (e.g. 2 names).'
  },
];

export default function Guide() {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Archetype & Identity', 'Sexual Dynamic & Vibe', 'Acts & Mechanics', 'Context & Setting'];

  const filteredTags = activeCategory === 'All'
    ? CANONICAL_30_TAGS
    : CANONICAL_30_TAGS.filter(t => t.category === activeCategory);

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <RosterBrand variant="logo" size={32} />
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
            Field Manual &amp; Playbook
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight editorial-header">
          The ROSTER Architecture
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
          A guide to the collection registry architecture, 30 canonical tags, behavioral memory, and recommendation engines.
        </p>
      </div>

      {/* 1. What ROSTER Is */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <HardDrive size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            1. What ROSTER Is
          </h2>
        </div>
        <div className="p-6 rounded-xl bg-[#10121a] border border-zinc-800 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            <strong className="text-white">ROSTER is a private collection registry, behavioral memory, and discovery system.</strong>
          </p>
          <p>
            The physical video files remain untouched on your external storage drive. The application never renames, moves, alters, duplicates, streams, or serves video files directly.
          </p>
          <p>
            Instead, ROSTER acts as your personal ledger and scouting room: indexing filenames and relative paths, resolving performers into relational entities, tracking rotation sessions, mapping multi-video combinations, and recommending what to experience next.
          </p>
        </div>
      </section>

      {/* 2. Collection Organization */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <FolderTree size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            2. How the Collection Is Organized
          </h2>
        </div>

        <div className="p-6 rounded-xl bg-[#10121a] border border-zinc-800 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            The physical drive is organized along an objective participant-count hierarchy:
          </p>

          <pre className="p-4 rounded-lg bg-zinc-950 font-mono text-xs text-amber-300 overflow-x-auto border border-zinc-800 leading-relaxed">
{`XXX/
├── 0 Favorites/        # Priority historical anchors
├── 1 Solo/             # Single performer focus
├── 2 Duo/              # Duos and pairs
├── 3 Threesome/        # Trios
└── 4(+) Group/         # Orgy, group, and party`}
          </pre>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono">
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-xs font-bold text-zinc-200 uppercase">Physical Metadata</span>
              <p className="text-xs text-zinc-400">
                Exact filename, folder location, resolution bracket, and file container on your local drive.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-xs font-bold text-zinc-200 uppercase">Semantic Metadata</span>
              <p className="text-xs text-zinc-400">
                Relational performers, canonical tags, participant count, and descriptive titles.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-xs font-bold text-zinc-200 uppercase">Behavioral Metadata</span>
              <p className="text-xs text-zinc-400">
                Session dates, durations, 1–5 ratings, orgasm outcomes, vibes, and multi-video synergies.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1">
              <span className="text-xs font-bold text-zinc-200 uppercase">Derived Intelligence</span>
              <p className="text-xs text-zinc-400">
                Lifecycle stage (Unwatched → Tested → Proven → High Signal), synergy patterns, and gaps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Authoritative 30 Canonical Tags */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <TagIcon size={18} className="text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
              3. Standardized 30-Tag Dictionary
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">30 Authoritative Tags</span>
        </div>

        <p className="text-xs text-zinc-400">
          ROSTER enforces a strict 30-tag canonical vocabulary across four functional categories. Synonyms and colloquialisms map conservatively into these definitions.
        </p>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 font-mono">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded border text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {filteredTags.map(tag => (
            <div
              key={tag.name}
              className="p-3.5 rounded-xl bg-[#10121a] border border-zinc-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <TagChip tag={tag.name} size="sm" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{tag.category}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                {tag.description}
              </p>
              {tag.synonyms && tag.synonyms.length > 0 && (
                <p className="text-[11px] text-zinc-500 font-mono">
                  Maps from: {tag.synonyms.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Vibes Reference */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <Flame size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            4. Vibe &amp; Energy Reference
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VIBES.map(v => (
            <div key={v.name} className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 space-y-1 font-mono">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                {v.name}
              </span>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Session Rating & Orgasm Reference */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <Star size={18} className="text-amber-400 fill-amber-400/20" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            5. Ratings &amp; Outcomes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Ratings */}
          <div className="space-y-3 font-mono">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Rating Scale (1 to 5)
            </span>
            <div className="space-y-2">
              {RATINGS.map(r => (
                <div key={r.level} className="p-3 rounded-lg bg-[#10121a] border border-zinc-800 text-xs space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-zinc-200">
                    <span className="text-amber-400">★ {r.level}</span>
                    <span>— {r.label}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] font-sans">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orgasm Status */}
          <div className="space-y-3 font-mono">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Orgasm Outcomes
            </span>
            <div className="space-y-2">
              {ORGASM_STATUSES.map(o => (
                <div key={o.status} className="p-3 rounded-lg bg-[#10121a] border border-zinc-800 text-xs space-y-0.5">
                  <span className="font-bold text-zinc-200 block">{o.status}</span>
                  <p className="text-zinc-400 text-[11px] font-sans">{o.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Discovery Modes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <Compass size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            6. Discovery Modes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {DISCOVERY_MODES.map(m => (
            <div key={m.name} className="p-4 rounded-xl bg-[#10121a] border border-zinc-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{m.name}</span>
                <span className="text-[10px] uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                  {m.intent}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed pt-1 font-sans">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Data Status & Confidence */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <ShieldCheck size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            7. Data Status &amp; Provenance
          </h2>
        </div>

        <div className="space-y-3 font-mono">
          {DATA_STATUSES.map(d => (
            <div key={d.badge} className="p-3.5 rounded-xl bg-[#10121a] border border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
              <span className={`px-2.5 py-1 rounded text-xs font-bold border self-start ${d.color}`}>
                {d.badge}
              </span>
              <p className="text-zinc-300 leading-relaxed flex-1 font-sans">
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. How ROSTER Thinks */}
      <section className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
          <Cpu size={18} className="text-amber-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono uppercase tracking-wider">
            8. System Mechanics
          </h2>
        </div>

        <div className="p-6 rounded-xl bg-[#10121a] border border-zinc-800 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <ul className="space-y-2.5 list-disc list-inside text-zinc-300">
            <li><strong className="text-white">Relational entity graph:</strong> Performers and tags are first-class relational objects with stable identifiers, aliases, and synonyms.</li>
            <li><strong className="text-white">Behavioral memory:</strong> Videos earn their status through your logs, not through arbitrary labels. A video moves from <span className="text-zinc-400 font-mono">Unwatched</span> → <span className="text-zinc-400 font-mono">Tested</span> → <span className="text-amber-400 font-mono">Proven</span> through repeated sessions and ratings.</li>
            <li><strong className="text-white">Multi-video synergies:</strong> ROSTER detects when specific pairs or sequences of videos produce consistently higher session ratings.</li>
            <li><strong className="text-white">Physical autonomy:</strong> The registry is a private memory layer over your physical external storage. You can disconnect your drive, change devices, or export your JSON at any time.</li>
          </ul>
        </div>
      </section>

      {/* Return to Roster CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-[#10121a] border border-amber-500/20">
        <div>
          <h4 className="text-sm font-bold text-white">Ready to explore?</h4>
          <p className="text-xs text-zinc-400">Head to the Roster to browse your collection, or configure Playback in Desk.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto font-mono">
          <Link
            to="/collection"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/30 transition-all active:scale-95"
          >
            <span>Open Roster</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
