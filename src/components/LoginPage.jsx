import React from 'react';

// Decorative "模彩" poker-chip logo
const ChipLogo = () => (
  <svg className="login-chip" viewBox="0 0 64 64" width="46" height="46" aria-hidden="true">
    <circle cx="32" cy="32" r="30" fill="#d81f2a" />
    <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff" strokeWidth="7" strokeDasharray="7 7.2" />
    <circle cx="32" cy="32" r="19.5" fill="#ffffff" />
    <circle cx="32" cy="32" r="14.5" fill="#d81f2a" />
    <circle cx="32" cy="32" r="5.5" fill="#ffffff" />
  </svg>
);

// Decorative captcha graphic (visual only — login is not validated)
const CaptchaImg = () => (
  <svg className="login-captcha-img" viewBox="0 0 92 36" aria-hidden="true">
    <text x="8" y="27" fontSize="24" fontWeight="700" fill="#4f8cff" transform="rotate(-14 16 20)">7</text>
    <text x="30" y="26" fontSize="24" fontWeight="700" fill="#ef6c3b" transform="rotate(9 38 20)">8</text>
    <text x="52" y="28" fontSize="24" fontWeight="700" fill="#7c3aed" transform="rotate(-8 60 20)">3</text>
    <text x="72" y="26" fontSize="24" fontWeight="700" fill="#22a06b" transform="rotate(12 80 20)">4</text>
    <path d="M4 26 C24 8, 60 30, 88 10" fill="none" stroke="#c7d2fe" strokeWidth="1.4" />
    <path d="M6 12 C30 30, 58 6, 86 24" fill="none" stroke="#fbcfe8" strokeWidth="1.4" />
  </svg>
);

const EyeIcon = ({ open }) => (
  open ? (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
);

export default function LoginPage({ onLogin }) {
  const [account, setAccount] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [captcha, setCaptcha] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // No validation — go straight in
    onLogin();
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <ChipLogo />
          <span className="login-logo-text">模彩</span>
        </div>

        <h1 className="login-title">会员登录</h1>

        <div className="login-field">
          <input
            className="login-input"
            type="text"
            placeholder="账号"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>

        <div className="login-field">
          <input
            className="login-input"
            type={showPwd ? 'text' : 'password'}
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="login-eye"
            onClick={() => setShowPwd((v) => !v)}
            title={showPwd ? '隐藏密码' : '显示密码'}
          >
            <EyeIcon open={showPwd} />
          </button>
        </div>

        <div className="login-field login-captcha-field">
          <input
            className="login-input"
            type="text"
            placeholder="请输入验证码"
            value={captcha}
            onChange={(e) => setCaptcha(e.target.value)}
          />
          <span className="login-captcha"><CaptchaImg /></span>
        </div>

        <button type="submit" className="login-submit">登录</button>
      </form>
    </div>
  );
}
