export default function Footer({
  balance,
  onRefreshBalance,
  selectedBetsCount,
  selectedBetsTotal,
  betAmount,
  setBetAmount,
  onReset,
  onSubmit,
  isClosed,
  chipValues,
  onOpenChipEdit
}) {
  // Total stake for the current selection. Prefer the parent-computed total
  // (which honours 快捷投注 per-号码 amounts); fall back to count × amount.
  const totalBetAmount = selectedBetsTotal != null
    ? selectedBetsTotal
    : selectedBetsCount * (parseInt(betAmount) || 0);

  // Handle click on a quick chip
  const handleChipClick = (val) => {
    if (isClosed) return;
    setBetAmount(val.toString());
  };

  return (
    <footer className="app-footer">
      {/* Row 1: Balance and Current Selections Summary */}
      <div className="footer-info-row">
        <div className="balance-box">
          <span>余额:</span>
          <span className="balance-amount">{balance.toLocaleString()}</span>
          <button 
            type="button"
            className="reload-btn" 
            onClick={onRefreshBalance}
            title="刷新余额"
            disabled={isClosed}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
        </div>
        <div className="bet-summary">
          共 <span>{selectedBetsCount}</span> 注 下注金额: <span>{totalBetAmount}</span>
        </div>
      </div>

      {/* Row 2: Quick Chip Buttons */}
      <div className="chips-row">
        {chipValues.map((val, idx) => {
          const isActive = betAmount === val.toString();
          return (
            <button
              key={idx}
              type="button"
              className={`chip-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleChipClick(val)}
              disabled={isClosed}
            >
              {val}
            </button>
          );
        })}
        <button
          type="button"
          className="edit-chip-btn"
          onClick={onOpenChipEdit}
          title="编辑快捷金额"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
      </div>

      {/* Row 3: Text Input, Reset, Bet Submit */}
      <div className="actions-row">
        <input
          type="number"
          pattern="[0-9]*"
          className="bet-amount-input"
          value={betAmount}
          onChange={(e) => setBetAmount(e.target.value)}
          placeholder="输入金额"
          disabled={isClosed}
        />
        <button
          type="button"
          className="btn-reset"
          onClick={onReset}
          disabled={isClosed || selectedBetsCount === 0}
        >
          重置
        </button>
        <button
          type="button"
          className="btn-submit"
          onClick={onSubmit}
          disabled={isClosed || selectedBetsCount === 0 || !betAmount || parseInt(betAmount) <= 0}
        >
          投注
        </button>
      </div>
    </footer>
  );
}
