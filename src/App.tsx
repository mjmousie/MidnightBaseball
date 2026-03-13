import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { CasinoTable } from './components/casino/CasinoTable';
import { IronCrossTable } from './components/ironCross/IronCrossTable';
import { HighLowTable } from './components/highLow/HighLowTable';

type GameMode = 'home' | 'casino' | 'ironCross' | 'highLow';

export default function App() {
  const [mode, setMode] = useState<GameMode>('home');

  if (mode === 'casino')    return <div className="fixed inset-0 bg-slate-800 overflow-hidden"><CasinoTable onBack={() => setMode('home')} /></div>;
  if (mode === 'ironCross') return <div className="fixed inset-0 bg-slate-800 overflow-hidden"><IronCrossTable onBack={() => setMode('home')} /></div>;
  if (mode === 'highLow')   return <div className="fixed inset-0 bg-slate-800 overflow-hidden"><HighLowTable onBack={() => setMode('home')} /></div>;

  return (
    <div className="fixed inset-0 bg-slate-800 overflow-hidden">
    <HomeScreen
      onSelectCasino={() => setMode('casino')}
      onSelectIronCross={() => setMode('ironCross')}
      onSelectHighLow={() => setMode('highLow')}
    />
    </div>
  );
}
