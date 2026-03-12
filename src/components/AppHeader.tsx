import { useBalanceStore } from '../store/balanceStore';
import { RulesButton } from './RulesModal';
import type { RulesTab } from './RulesModal';

interface AppHeaderProps {
  onHome?: () => void;                // if provided, shows Section 2 (game pages)
  rulesTab?: RulesTab;                // which rules tab to open
  payoutsTab?: RulesTab;              // if provided, shows Payouts button
}

export function AppHeader({ onHome, rulesTab = 'core', payoutsTab }: AppHeaderProps) {
  const { balance } = useBalanceStore();

  return (
    <div className="flex-shrink-0 flex flex-col bg-slate-800 border-b border-slate-700">

      {/* Section 1 — always visible */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-slate-200 font-black text-md tracking-tight">♦MoosesRoom.com</span>
        <div className="bg-orange-600 rounded-full ml-1 px-6 py-1 border border-orange-700">
          <span className="text-xs text-orange-900 font-bold">Balance</span>
          <span className="ml-2 text-slate-200 font-medium text-md">${balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Section 2 — game pages only */}
      {onHome && (
        <div className="flex items-center justify-between py-2.5 px-4 bg-slate-700">

          {/* Home */}
          <button onClick={onHome}
            className="text-orange-400 hover:text-orange-300 text-sm font-semibold transition">
            ← Home
          </button>

          {/* Rules */}
          <RulesButton
            defaultTab={rulesTab}
            className="text-slate-400 hover:text-slate-200 text-sm transition"
          />

          {/* Payouts or spacer */}
          {payoutsTab ? (
            <RulesButton
              defaultTab={payoutsTab}
              label="Payouts"
              className="text-slate-400 hover:text-slate-200 text-sm transition"
            />
          ) : (
            <span className="w-10" /> /* spacer to keep rules centered */
          )}

        </div>
      )}
    </div>
  );
}
