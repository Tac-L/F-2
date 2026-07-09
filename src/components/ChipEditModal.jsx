import { useState, useEffect } from 'react';

// 编辑快捷金额弹窗（投注页 footer 与 计划中心-自动跟投 共用同一套快捷金额）。
// overPlan=true 时抬到计划中心 (.fp-page z-index 3000) 之上。
export default function ChipEditModal({ open, chipValues, onSave, onClose, overPlan = false }) {
  const [tempChips, setTempChips] = useState(() => chipValues.map(String));

  // Re-seed the inputs each time the modal opens.
  useEffect(() => {
    if (open) setTempChips(chipValues.map(String));
  }, [open, chipValues]);

  if (!open) return null;

  const handleRestoreDefault = () => setTempChips(['10', '20', '40', '60', '100']);

  const handleSave = (e) => {
    e.preventDefault();
    const sanitized = tempChips.map((val) => {
      const parsed = parseInt(val, 10);
      return (isNaN(parsed) || parsed <= 0) ? 1 : parsed;
    });
    onSave(sanitized);
    onClose();
  };

  return (
    <div className={`modal-overlay${overPlan ? ' modal-overlay--over-plan' : ''}`}>
      <form className="modal-content" onSubmit={handleSave}>
        <div className="modal-header">
          <div className="modal-title">编辑快捷金额</div>
          <button type="button" className="confirm-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-inputs">
          {tempChips.map((val, idx) => (
            <div key={idx} className="modal-input-group">
              <span className="chip-index">{idx + 1}</span>
              <div className="chip-input-wrap">
                <input
                  type="number"
                  inputMode="numeric"
                  value={val}
                  onChange={(e) => {
                    const newChips = [...tempChips];
                    newChips[idx] = e.target.value;
                    setTempChips(newChips);
                  }}
                />
                <span className="chip-input-suffix">元</span>
              </div>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="modal-btn modal-btn-cancel" onClick={handleRestoreDefault}>
            恢复默认
          </button>
          <button type="submit" className="modal-btn modal-btn-save">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
