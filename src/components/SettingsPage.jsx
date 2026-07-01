import React from 'react';

const THEME_OPTIONS = [
  {
    id: 'light-blue',
    name: '浅蓝白',
    desc: '清爽的天蓝色系',
    // swatch preview colors
    header: '#e0f2fe',
    accent: '#3b82f6',
    text: '#2563eb',
  },
  {
    id: 'deep-blue',
    name: '深蓝白',
    desc: '沉稳的靛蓝色系',
    header: '#547cfd',
    accent: '#547cfd',
    text: '#ffffff',
  },
];

const LANGUAGE_OPTIONS = [
  { id: 'zh-CN', name: '简体中文', desc: 'Simplified Chinese' },
  { id: 'zh-TW', name: '繁体中文', desc: 'Traditional Chinese' },
];

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function SettingsPage({ onBack, onOpenMenu, theme, onChangeTheme, lang, onChangeLang, onLogout }) {
  const [subPage, setSubPage] = React.useState('menu'); // 'menu' | 'skin' | 'password' | 'language'

  const title =
    subPage === 'skin' ? '皮肤切换'
    : subPage === 'password' ? '密码设置'
    : subPage === 'language' ? '选择语言'
    : '设置';

  const handleBack = () => {
    if (subPage === 'menu') {
      onBack();
    } else {
      setSubPage('menu');
    }
  };

  const menuItems = [
    {
      id: 'password',
      name: '密码设置',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      id: 'skin',
      name: '皮肤切换',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996C20.055 15.101 22 13.100 22 10.667 22 5.983 17.523 2 12 2z" />
        </svg>
      ),
    },
    // 「选择语言」暂时隐藏，需要时再恢复此项
    // {
    //   id: 'language',
    //   name: '选择语言',
    //   icon: (
    //     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    //       <circle cx="12" cy="12" r="10" />
    //       <path d="M2 12h20" />
    //       <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    //     </svg>
    //   ),
    // },
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <button type="button" className="settings-back-btn" onClick={handleBack} title="返回">
          <BackIcon />
        </button>
        <span className="settings-title">{title}</span>
        <button type="button" className="settings-menu-btn" onClick={onOpenMenu} title="菜单">
          <MenuIcon />
        </button>
      </div>

      <div className="settings-body">
        {subPage === 'menu' && (
          <div className="settings-menu-view">
            <nav className="settings-list">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="settings-row"
                  onClick={() => setSubPage(item.id)}
                >
                  <span className="settings-row-icon">{item.icon}</span>
                  <span className="settings-row-name">{item.name}</span>
                  <span className="settings-row-arrow"><ChevronRight /></span>
                </button>
              ))}
            </nav>

            <div className="settings-logout-wrap">
              <button type="button" className="settings-logout-btn" onClick={onLogout}>
                退出登录
              </button>
            </div>
          </div>
        )}

        {subPage === 'skin' && (
          <div className="settings-skin">
            <div className="settings-section-label">选择主题</div>
            {THEME_OPTIONS.map((opt) => {
              const isActive = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`skin-option ${isActive ? 'active' : ''}`}
                  onClick={() => onChangeTheme(opt.id)}
                >
                  <span
                    className="skin-swatch"
                    style={{ background: opt.header }}
                  >
                    <span className="skin-swatch-dot" style={{ background: opt.accent }} />
                  </span>
                  <span className="skin-option-text">
                    <span className="skin-option-name">{opt.name}</span>
                    <span className="skin-option-desc">{opt.desc}</span>
                  </span>
                  {isActive && <span className="skin-check"><CheckIcon /></span>}
                </button>
              );
            })}
          </div>
        )}

        {subPage === 'language' && (
          <div className="settings-skin">
            <div className="settings-section-label">选择语言</div>
            {LANGUAGE_OPTIONS.map((opt) => {
              const isActive = lang === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`skin-option ${isActive ? 'active' : ''}`}
                  onClick={() => onChangeLang(opt.id)}
                >
                  <span className="skin-option-text">
                    <span className="skin-option-name">{opt.name}</span>
                    <span className="skin-option-desc">{opt.desc}</span>
                  </span>
                  {isActive && <span className="skin-check"><CheckIcon /></span>}
                </button>
              );
            })}
          </div>
        )}

        {subPage === 'password' && (
          <div className="settings-placeholder">
            <p>密码设置功能开发中，敬请期待。</p>
          </div>
        )}
      </div>
    </div>
  );
}
