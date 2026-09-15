import { useState } from 'react';
import { ImportExport } from '../engines/importExport';
import { initializeDatabase } from '../utils/initDb';
import { Download, Upload, DatabaseZap } from 'lucide-react';

export default function Settings() {
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleExport = async () => {
    try {
      const dataStr = await ImportExport.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `t9-registry-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMsg({ text: 'Export successful.', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Export failed.', type: 'error' });
    }
  };

  const handleSeed = async () => {
    try {
      await initializeDatabase();
      setMsg({ text: 'Database seed process completed. (Skipped if already populated).', type: 'success' });
    } catch (err) {
      console.error(err);
      setMsg({ text: 'Seed process failed.', type: 'error' });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">Settings & Reference</h2>
      
      {msg.text && (
        <div className={`p-4 rounded-xl border ${msg.type === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-300' : 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'}`}>
          <p className="text-sm">{msg.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-lg">
              <Download className="text-neutral-300" size={20} />
            </div>
            <h3 className="font-medium text-lg">Export Data</h3>
          </div>
          <p className="text-neutral-400 text-sm">Download a complete canonical JSON backup of your registry.</p>
          <button 
            onClick={handleExport}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Export JSON
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-800 rounded-lg">
              <DatabaseZap className="text-neutral-300" size={20} />
            </div>
            <h3 className="font-medium text-lg">Initial Seed</h3>
          </div>
          <p className="text-neutral-400 text-sm">Load the sample list if the database is empty. Will not overwrite existing data.</p>
          <button 
            onClick={handleSeed}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 rounded-lg transition-colors"
          >
            Run Seed Script
          </button>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4 mt-6">
        <h3 className="font-medium text-lg border-b border-neutral-800 pb-2">Reference Vocabularies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Session Ratings</h4>
            <ul className="space-y-1 text-neutral-500">
              <li><span className="text-neutral-300">5</span> — Nuclear / ruined me</li>
              <li><span className="text-neutral-300">4</span> — Very strong</li>
              <li><span className="text-neutral-300">3</span> — Solid</li>
              <li><span className="text-neutral-300">2</span> — Meh</li>
              <li><span className="text-neutral-300">1</span> — Why did I bother</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Vibe / Energy</h4>
            <ul className="space-y-1 text-neutral-500">
              <li>Aggressive</li>
              <li>Worship</li>
              <li>Filthy</li>
              <li>Degrading</li>
              <li>Tender</li>
              <li>Chaotic</li>
              <li>Power</li>
              <li>Size-focused</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-neutral-300 mb-2">Orgasm Status</h4>
            <ul className="space-y-1 text-neutral-500">
              <li>Came</li>
              <li>Edged Only</li>
              <li>Both</li>
              <li>Neither</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
