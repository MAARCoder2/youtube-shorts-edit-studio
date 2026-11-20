import { Download } from 'lucide-react';

export type InspectorTab = 'controls' | 'cuts' | 'audio';

interface TopBarProps {
  activeTab: InspectorTab;
  onSelectTab: (tab: InspectorTab) => void;
  onFocusTimeline: () => void;
  downloadUrl: string;
  isRendering: boolean;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onFocusTimeline,
  downloadUrl,
  isRendering,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#222A38] bg-[#0B0E14]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-8 px-6">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        >
          ShortCut Studio
        </a>

        {/* Zone 2: 4 single-line clean text navigation links */}
        <nav
          aria-label="Primary studio sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400"
        >
          <button
            type="button"
            onClick={() => onSelectTab('controls')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'controls'
                ? 'border-amber-500 text-slate-50'
                : 'border-transparent hover:text-slate-100'
            }`}
          >
            Edit Controls
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('cuts')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'cuts'
                ? 'border-amber-500 text-slate-50'
                : 'border-transparent hover:text-slate-100'
            }`}
          >
            Cut Log
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('audio')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'audio'
                ? 'border-amber-500 text-slate-50'
                : 'border-transparent hover:text-slate-100'
            }`}
          >
            Audio &amp; B-Roll
          </button>
          <button
            type="button"
            onClick={onFocusTimeline}
            className="py-1 border-b-2 border-transparent hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Timeline
          </button>
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <a
            href={downloadUrl}
            download
            aria-disabled={isRendering}
            className={`inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 whitespace-nowrap shrink-0 ${
              isRendering ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Download MP4</span>
          </a>
        </div>
      </div>
    </header>
  );
}
