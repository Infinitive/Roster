import React, { useState } from 'react';
import { Storage } from '../storage/db';
import { createNewVideo } from '../engines/parser';
import { Save, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuickAdd() {
  const [filename, setFilename] = useState('');
  const [relativePath, setRelativePath] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    if (!filename.trim()) {
      setErrorMsg('Filename is required.');
      return;
    }
    
    if (!relativePath.trim()) {
      setErrorMsg('Relative path is required to determine folder and participant count.');
      return;
    }

    try {
      const newVideo = createNewVideo(filename, relativePath);
      await Storage.saveVideo(newVideo);
      
      setSuccessMsg(newVideo.id);
      setFilename('');
      setRelativePath('');
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(''), 10000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save video to local storage.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Quick Add</h2>
        <p className="text-neutral-400">Add a new video in under 60 seconds. The system will automatically extract metadata from the filename.</p>
      </div>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">Final Filename</label>
            <input 
              type="text" 
              placeholder="e.g. Performer A | Descriptive Title | Tag A, Tag B [1080p]" 
              value={filename}
              onChange={e => setFilename(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all text-white placeholder-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-1">Include performers, title, tags, and resolution.</p>
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-300">Relative Path</label>
            <input 
              type="text" 
              placeholder="e.g. John's T9/XXX/2/Hard & Rough / Intense/" 
              value={relativePath}
              onChange={e => setRelativePath(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all text-white placeholder-neutral-600"
            />
            <p className="text-xs text-neutral-500 mt-1">Used to determine participant count and folder automatically.</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-200 hover:bg-white text-neutral-950 font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              <Save size={18} />
              Save Record
            </button>
          </div>
        </form>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-500" size={18} />
            <p className="text-emerald-300 text-sm">Successfully added record.</p>
          </div>
          <Link 
            to={`/video/${successMsg}`}
            className="flex items-center gap-1 text-xs font-medium bg-emerald-900/50 text-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-800/50 transition-colors"
          >
            Open Video <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={18} />
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}
      
      <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
        <h3 className="font-medium text-neutral-200">Design Principle</h3>
        <p className="text-neutral-400 text-sm italic">"Capture now. Enrich later."</p>
        <p className="text-neutral-500 text-sm">
          You don't need to manually enter every tag, resolution, or performer here. The parser will extract what it can, and you can edit the full record later in the Collection view.
        </p>
      </div>
    </div>
  );
}
