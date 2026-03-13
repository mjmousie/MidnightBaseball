import { AppHeader } from './AppHeader';

interface HomeScreenProps {
  onSelectCasino: () => void;
  onSelectIronCross: () => void;
  onSelectHighLow: () => void;
}

export function HomeScreen({ onSelectCasino, onSelectIronCross, onSelectHighLow }: HomeScreenProps) {
  return (
    <div className="h-dvh bg-slate-800 flex flex-col overflow-hidden">

      <AppHeader />

      {/* Title block */}
      <div className="flex-shrink-0 flex flex-col items-center pt-8 pb-4 px-4">
        <h1 className="text-xl font-black text-slate-100 tracking-tight">Pick Your "Skill" Game</h1>
        <p className="text-slate-500 text-xs mt-1">Good luck!</p>
      </div>

      {/* Game list */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 pb-6 overflow-y-auto">

        {/* Casino Style */}
        <button onClick={onSelectCasino}
          className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-orange-500/40 rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3">
          <div className="text-2xl flex-shrink-0 text-slate-500">⚪</div>
          <div className="min-w-0">
            <h2 className="text-slate-100 font-bold text-sm mb-0.5">Midnight Baseball</h2>
            <p className="text-slate-400 text-xs leading-relaxed">Bet on Player or Widow. Face the Dealer with wagers on wilds and bonus cards.</p>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">1 vs Dealer</span>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">1:1 Payout</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-orange-500 text-lg ml-auto">›</div>
        </button>

        {/* Iron Cross */}
        <button onClick={onSelectIronCross}
          className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-orange-500/40 rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3">
          <div className="text-4xl flex-shrink-0 text-slate-400">♰</div>
          <div className="min-w-0">
            <h2 className="text-slate-100 font-bold text-sm mb-0.5">Iron Cross</h2>
            <p className="text-slate-400 text-xs leading-relaxed">5 cards each plus a cross-shaped board. Choose a row, back up your bet, battle the Dealer.</p>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">1 vs Dealer</span>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">Back Up Bet</span>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">Bonus Bet</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-orange-500 text-lg ml-auto">›</div>
        </button>

        {/* High or Low */}
        <button onClick={onSelectHighLow}
          className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-orange-500/40 rounded-2xl p-4 text-left transition-all duration-200 flex items-center gap-3">
          <div className="text-4xl text-slate-400 flex-shrink-0">↑↓</div>
          <div className="min-w-0">
            <h2 className="text-slate-100 font-bold text-sm mb-0.5">Hi/Lo</h2>
            <p className="text-slate-400 text-xs leading-relaxed">Predict if the next card is higher or lower. Build a streak to multiply your winnings.</p>
            <div className="mt-1.5 flex gap-1.5 flex-wrap">
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">Solo</span>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">Up to 25×</span>
              <span className="text-[10px] bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded-full">Cash Out Anytime</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-orange-500 text-lg ml-auto">›</div>
        </button>

      </div>
    </div>
  );
}
