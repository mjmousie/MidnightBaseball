import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { CasinoTable } from './components/casino/CasinoTable';
import { IronCrossTable } from './components/ironCross/IronCrossTable';
import { HighLowTable } from './components/highLow/HighLowTable';

type GameMode = 'home' | 'casino' | 'ironCross' | 'highLow';

export default function App() {
  const [mode, setMode] = useState<GameMode>('home');

  if (mode === 'casino')    return <CasinoTable onBack={() => setMode('home')} />;
  if (mode === 'ironCross') return <IronCrossTable onBack={() => setMode('home')} />;
  if (mode === 'highLow')   return <HighLowTable onBack={() => setMode('home')} />;

  return (
    <HomeScreen
      onSelectCasino={() => setMode('casino')}
      onSelectIronCross={() => setMode('ironCross')}
      onSelectHighLow={() => setMode('highLow')}
    />
  );
}
