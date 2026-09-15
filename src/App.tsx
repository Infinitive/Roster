/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Overview from './pages/Overview';
import Collection from './pages/Collection';
import QuickAdd from './pages/QuickAdd';
import More from './pages/More';
import Guide from './pages/Guide';
import Sessions from './pages/Sessions';
import Watchlist from './pages/Watchlist';
import VideoDetail from './pages/VideoDetail';
import SessionDetail from './pages/SessionDetail';
import Analytics from './pages/Analytics';
import Discovery from './pages/Discovery';
import Insight from './pages/Insight';
import { PlaybackProvider } from './context/PlaybackContext';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <PlaybackProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Overview />} />
            <Route path="insight" element={<Insight />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="collection" element={<Collection />} />
            <Route path="video/:id" element={<VideoDetail />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="sessions/new" element={<SessionDetail />} />
            <Route path="sessions/:id" element={<SessionDetail />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="quick-add" element={<QuickAdd />} />
            <Route path="guide" element={<Guide />} />
            <Route path="more" element={<More />} />
            <Route path="settings" element={<More />} />
          </Route>
        </Routes>
      </PlaybackProvider>
    </BrowserRouter>
  );
}
