import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Table } from './components/Table';
import { CasinoTable } from './components/casino/CasinoTable';
import { IronCrossTable } from './components/ironCross/IronCrossTable';

type GameMode = 'home' | 'conventional' | 'casino' | 'ironCross';

export default function App() {
  const [mode, setMode] = useState<GameMode>('home');
  if (mode === 'casino')       return <CasinoTable onBack={() => setMode('home')} />;
  if (mode === 'ironCross')    return <IronCrossTable onBack={() => setMode('home')} />;

  return (
    <HomeScreen
      onSelectCasino={() => setMode('casino')}
      onSelectIronCross={() => setMode('ironCross')}
    />
  );
}
