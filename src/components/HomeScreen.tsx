import { RulesButton } from './RulesModal';

interface HomeScreenProps {
  onSelectCasino: () => void;
  onSelectIronCross: () => void;
}

export function HomeScreen({ onSelectCasino, onSelectIronCross }: HomeScreenProps) {
  return (
    <div className="min-h-full bg-green-900 flex items-center justify-center p-4 py-40">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xl mb-4">❤️♠️♦️♣️</div>
          <h1 className="text-4xl font-bold text-white mb-2">Moose's Room</h1>
          <p className="text-green-300 text-sm">Moose's favorite backroom poker games, now online.</p>
          <div className="mt-3">
            <RulesButton defaultTab="casino" className="text-green-300 hover:text-white text-sm underline" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Conventional */}

          {/* Casino Style */}
          <button
            onClick={onSelectCasino}
            className="group bg-emerald-800/40 hover:bg-emerald-700/50 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚾</div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1">Midnight Baseball</h2>
                <p className="text-green-300 text-sm leading-relaxed">
                  Bet on the Banker or Player side. Face the Dealer in a high-stakes battle with wagers on wilds, bonus cards, and 1:1 payouts.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">1 vs Dealer</span>
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">Betting</span>
                  <span className="text-xs bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded-full">1:1 Payout</span>
                </div>
              </div>
            </div>
          </button>

          {/* Iron Cross */}
          <button
            onClick={onSelectIronCross}
            className="group bg-emerald-800/40 hover:bg-emerald-700/50 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl text-white">⛨</div>
              <div>
                <h2 className="text-white font-bold text-xl mb-1">The Cross</h2>
                <p className="text-green-300 text-sm leading-relaxed">
                  5 cards each plus a cross-shaped board. Choose a row, back up your bet, then battle the Dealer for the best hand.
                </p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="text-xs bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full">1 vs Dealer</span>
                  <span className="text-xs bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full">Board Game</span>
                  <span className="text-xs bg-emerald-800/60 text-emerald-200 px-2 py-0.5 rounded-full">Back Up Bet</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
