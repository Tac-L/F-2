import { useState } from 'react';

export default function Footer({
  balance,
  onRefreshBalance,
  selectedBetsCount,
  betAmount,
  setBetAmount,
  onReset,
  onSubmit,
  isClosed,
  chipValues,
  onUpdateChips
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempChips, setTempChips] = useState(() => chipValues.map(String));

  // Calculate total bet amount
  const totalBetAmount = selectedBetsCount * (parseInt(betAmount) || 0);

  // Open modal and initialize values
  const handleOpenEdit = () => {
    setTempChips(chipValues.map(String));
    setIsEditModalOpen(true);
  };

  // Restore default chips
  const handleRestoreDefault = () => {
    setTempChips(['10', '20', '40', '60', '100']);
  };

  // Save customized chips
  const handleSaveChips = (e) => {
    e.preventDefault();
    const sanitizedChips = tempChips.map(val => {
      const parsed = parseInt(val);
      return (isNaN(parsed) || parsed <= 0) ? 1 : parsed;
    });
    onUpdateChips(sanitizedChips);
    setIsEditModalOpen(false);
  };

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
          onClick={handleOpenEdit}
          disabled={isClosed}
          title="修改快选金额"
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

      {/* Custom Chips Editor Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSaveChips}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', position: 'relative' }}>
              <div className="modal-title" style={{ margin: 0, flex: 1, textAlign: 'center' }}>自定义快选金额</div>
              <button 
                type="button" 
                className="confirm-modal-close" 
                onClick={() => setIsEditModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-inputs">
              {tempChips.map((val, idx) => (
                <div key={idx} className="modal-input-group">
                  <label>{idx + 1}</label>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) => {
                      const newChips = [...tempChips];
                      newChips[idx] = e.target.value;
                      setTempChips(newChips);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={handleRestoreDefault}
              >
                恢复默认
              </button>
              <button
                type="submit"
                className="modal-btn modal-btn-save"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      )}
    </footer>
  );
}
