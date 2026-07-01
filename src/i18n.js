import { Converter } from 'opencc-js';

// Simplified (mainland) -> Traditional (Taiwan) converter.
const s2t = Converter({ from: 'cn', to: 'tw' });

const HAN = /[一-鿿]/;

export function getLang() {
  try {
    return localStorage.getItem('appLang') === 'zh-TW' ? 'zh-TW' : 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

export function setLang(lang) {
  try {
    localStorage.setItem('appLang', lang === 'zh-TW' ? 'zh-TW' : 'zh-CN');
  } catch {
    /* ignore storage errors */
  }
}

// The app is authored in Simplified Chinese. When Traditional is selected we
// convert every rendered Chinese string to Traditional and keep converting as
// React updates the DOM (new nodes, text changes, placeholders/titles).
// Returns a function that stops the observer.
export function startTraditional(root = document.body) {
  const ATTRS = ['placeholder', 'title', 'alt'];

  const convertTextNode = (node) => {
    const v = node.nodeValue;
    if (v && HAN.test(v)) {
      const c = s2t(v);
      if (c !== v) node.nodeValue = c;
    }
  };

  const convertAttrs = (el) => {
    if (!el.getAttribute) return;
    for (const attr of ATTRS) {
      if (el.hasAttribute(attr)) {
        const v = el.getAttribute(attr);
        if (v && HAN.test(v)) {
          const c = s2t(v);
          if (c !== v) el.setAttribute(attr, c);
        }
      }
    }
  };

  const walk = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) convertTextNode(n);
    if (el.querySelectorAll) {
      convertAttrs(el);
      el.querySelectorAll(`[${ATTRS.join('],[')}]`).forEach(convertAttrs);
    }
  };

  walk(root);

  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') {
        convertTextNode(m.target);
      } else if (m.type === 'attributes' && m.target.nodeType === 1) {
        convertAttrs(m.target);
      } else if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) convertTextNode(n);
          else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
        });
      }
    }
  });

  obs.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  });

  return () => obs.disconnect();
}
