import { RulesButton } from './RulesModal';

interface HomeScreenProps {
  onSelectCasino: () => void;
  onSelectIronCross: () => void;
}

export function HomeScreen({ onSelectCasino, onSelectIronCross }: HomeScreenProps) {
  return (
    <div className="h-dvh bg-slate-800 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col items-center pt-8 pb-4 px-4">
        <div className="text-5xl mb-2"></div>
        <h1 className="text-2xl font-bold text-white">Moose's Room</h1>
        <div className="flex items-center gap-3 mt-1">
          <RulesButton defaultTab="core" className="text-orange-400 hover:text-white text-xs underline" />
        </div>
        <p className="text-slate-300 text-lg my-4">Choose your fuckery...</p>
      </div>

      {/* Game selector — fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 pb-6 overflow-hidden">

        {/* Midnight Baseball */}
        <button onClick={onSelectCasino}
          className="group bg-emerald-slate/40 hover:bg-slate-700/50 border border-slate-500/30 hover:border-slate-400/60 rounded-2xl p-5 text-left transition-all duration-200 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0">⚾</div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base mb-0.5">Midnight Baseball</h2>
            <p className="text-white text-s leading-relaxed">Bet on Player or Widow. Face the Dealer with wagers on wilds and bonus cards.</p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <span className="text-[12px] bg-slate-500/60 text-slate-200 px-1.5 py-0.5 rounded-full">1 vs Dealer</span>
              <span className="text-[12px] bg-slate-500/60 text-slate-200 px-1.5 py-0.5 rounded-full">1:1 Payout</span>
            </div>
          </div>
        </button>

        {/* Iron Cross */}
        <button onClick={onSelectIronCross}
          className="group bg-slate-800/40 hover:bg-red-slate/50 border border-slate-500/30 hover:bg-slate-700/50 hover:border-slate-400/60 rounded-2xl p-5 text-left transition-all duration-200 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0 text-orange-600">🕀</div>
          <div className="min-w-0">
            <h2 className="text-white font-bold text-base mb-0.5">Iron Cross</h2>
            <p className="text-white text-s leading-relaxed">5 cards each plus a cross-shaped board. Choose a row, back up your bet, battle the Dealer.</p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <span className="text-[12px] bg-slate-700/60 text-slate-100 px-1.5 py-0.5 rounded-full">1 vs Dealer</span>
              <span className="text-[12px] bg-slate-700/60 text-slate-100 px-1.5 py-0.5 rounded-full">Back Up Bet</span>
              <span className="text-[12px] bg-slate-700/60 text-slate-100 px-1.5 py-0.5 rounded-full">Bonus Bet</span>
              <span className="text-[12px] bg-slate-500/60 text-slate-200 px-1.5 py-0.5 rounded-full">1:1 Payout</span>
            </div>
          </div>
        </button>

      </div>
    </div>
  );
}
