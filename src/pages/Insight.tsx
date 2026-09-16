import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Discovery from './Discovery';
import Analytics from './Analytics';
import Watchlist from './Watchlist';
import SegmentedControl, { SegmentOption } from '../components/ui/SegmentedControl';
import { Sparkles, BarChart3, Bookmark } from 'lucide-react';

type Tab = 'discovery' | 'patterns' | 'queue';

const TAB_OPTIONS: SegmentOption<Tab>[] = [
  { id: 'discovery', label: 'Scout Engine', icon: <Sparkles size={14} /> },
  { id: 'patterns', label: 'The Ledger (Stats)', icon: <BarChart3 size={14} /> },
  { id: 'queue', label: 'Lineup Queue', icon: <Bookmark size={14} /> },
];

export default function Insight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'discovery';
  const [activeTab, setActiveTab] = useState<Tab>(
    ['discovery', 'patterns', 'queue'].includes(initialTab) ? initialTab : 'discovery'
  );

  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab;
    if (tabParam && ['discovery', 'patterns', 'queue'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Pillar Segmented Control */}
      <div className="flex justify-center sm:justify-start pb-2">
        <SegmentedControl<Tab>
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={handleTabChange}
          size="md"
        />
      </div>

      {/* Render Active View */}
      <div>
        {activeTab === 'discovery' && <Discovery />}
        {activeTab === 'patterns' && <Analytics />}
        {activeTab === 'queue' && <Watchlist />}
      </div>
    </div>
  );
}
