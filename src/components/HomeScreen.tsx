interface HomeScreenProps {
  onSelectConventional: () => void;
  onSelectCasino: () => void;
}

export function HomeScreen({ onSelectConventional, onSelectCasino }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌙⚾</div>
          <h1 className="text-4xl font-bold text-white mb-2">Midnight Baseball</h1>
          <p className="text-green-300 text-sm">Choose your game</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Conventional */}
          <button
            onClick={onSelectConventional}
            className="group bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🃏</div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Conventional</h2>
                <p className="text-green-300 text-sm leading-relaxed">
                  Classic Midnight Baseball. 2 to 7 players take turns flipping cards to beat the current high hand. Wild 3s &amp; 9s, Bonus Card on 4s.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="text-xs bg-green-700/60 text-green-200 px-2 py-0.5 rounded-full">2 to 7 Players</span>
                  <span className="text-xs bg-green-700/60 text-green-200 px-2 py-0.5 rounded-full">Wilds: 3s & 9s</span>
                  <span className="text-xs bg-green-700/60 text-green-200 px-2 py-0.5 rounded-full">Bonus: 4s</span>
                </div>
              </div>
            </div>
          </button>

          {/* Casino Style */}
          <button
            onClick={onSelectCasino}
            className="group bg-emerald-800/40 hover:bg-emerald-700/50 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🎰</div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Casino Style</h2>
                <p className="text-green-300 text-sm leading-relaxed">
                  Bet on the Widow or Player side in a high-stakes battle with wagers on wilds, bonus cards, and 1:1 payouts.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">1 vs Dealer</span>
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">Betting</span>
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">1:1 Payout</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
