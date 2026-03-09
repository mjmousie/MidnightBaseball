import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Table } from './components/Table';
import { CasinoTable } from './components/casino/CasinoTable';

type GameMode = 'home' | 'conventional' | 'casino';

export default function App() {
  const [mode, setMode] = useState<GameMode>('home');

  if (mode === 'conventional') {
    return <Table onGoHome={() => setMode('home')} />;
  }

  if (mode === 'casino') {
    return <CasinoTable onBack={() => setMode('home')} />;
  }

  return (
    <HomeScreen
      onSelectConventional={() => setMode('conventional')}
      onSelectCasino={() => setMode('casino')}
    />
  );
}
