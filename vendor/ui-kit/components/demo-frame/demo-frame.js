/*!
 * demo-frame — рамка интерактивного демо: шапка (название, версия, статус), сцена фиксированного размера
 * и вспомогательная панель справа (устройство, сценарии, ссылки, команда). Шапка, сцена и панель
 * масштабируются как одно целое под размер окна. Без зависимостей.
 * https://github.com/MarieSmi/ui-kit/tree/main/components/demo-frame
 */
(function () {
  'use strict';

  const VERSION = '1.0.0';

  // Иконки (Figma xMQ3ZEN4AUINgwjVoxR8hS 18715:93398) — красятся currentColor
  const ICONS = {
    laptop: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M1 5C1 3.34315 2.34315 2 4 2H12C13.6569 2 15 3.34315 15 5V12H1V5ZM4 3H12C13.1046 3 14 3.89543 14 5V11H2V5C2 3.89543 2.89543 3 4 3Z"/><path fill="currentColor" fill-rule="evenodd" d="M1 14.5C1 13.6716 1.67157 13 2.5 13H13.5C14.3284 13 15 13.6716 15 14.5C15 15.3284 14.3284 16 13.5 16H2.5C1.67157 16 1 15.3284 1 14.5ZM2.5 14H13.5C13.7761 14 14 14.2239 14 14.5C14 14.7761 13.7761 15 13.5 15H2.5C2.22386 15 2 14.7761 2 14.5C2 14.2239 2.22386 14 2.5 14Z"/></svg>',
    monitor: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M0 0H16V9C16 10.6569 14.6569 12 13 12H3C1.34315 12 0 10.6569 0 9V0ZM1 1H15V9C15 10.1046 14.1046 11 13 11H3C1.89543 11 1 10.1046 1 9V1Z"/><path fill="currentColor" fill-rule="evenodd" d="M5.70313 13.4453C5.8886 13.1671 6.20083 13 6.53518 13H9.46482C9.79917 13 10.1114 13.1671 10.2969 13.4453L10.9635 14.4453C11.4066 15.1099 10.9302 16 10.1315 16H5.86852C5.06982 16 4.59343 15.1099 5.03647 14.4453L5.70313 13.4453ZM6.53518 14H9.46482L10.1315 15H5.86852L6.53518 14Z"/></svg>',
    back: '<svg width="7.5" height="13" viewBox="0 0 7.5 13" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M6 0L7.5 1.25L2.5 6.5L7.5 11.75L6 13L0 6.50001L6 0Z"/></svg>',
    // глиф E63C из cbuc-icons («открыть в новом окне»), em 512 → 16
    link: '<svg width="16" height="16" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" transform="translate(0 480) scale(1 -1)" d="M64 52Q64 44 68.0 38.0Q72 32 80 32H428Q436 32 442.0 38.0Q448 44 448 52V192H480V52Q480 30 465.0 15.0Q450 0 428 0H84Q62 0 47.0 15.0Q32 30 32 52V396Q32 418 47.0 433.0Q62 448 84 448H224V416H84Q76 416 70.0 410.0Q64 404 64 396ZM464 448Q480 448 480 432V288H448V393L283 229Q278 224 272.0 224.0Q266 224 261 229Q256 234 256.0 240.0Q256 246 261 251L425 416H320V448Z"/></svg>',
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  // ---------- Шапка ----------
  function headHTML(h) {
    const title = `<h1 class="df-head__title">${esc(h.title)}${h.version ? ` <span class="df-head__ver">${esc(h.version)}</span>` : ''}</h1>`;
    const top = h.href
      ? `<a class="df-head__link" href="${esc(h.href)}"><span class="df-head__back">${ICONS.back}</span>${title}</a>`
      : `<div class="df-head__link df-head__link--plain">${title}</div>`;
    return top + (h.status ? `<div class="df-head__sub${h.href ? '' : ' df-head__sub--plain'}">${esc(h.status)}</div>` : '');
  }

  // ---------- Сценарии ----------
  // Пункт: { id, title, disabled, hidden, variants: [{ id, title, disabled }] }; группа: { group, items, hidden }.
  // Подряд идущие пункты без группы — один белый блок.
  function radioHTML(scenario, variant, title, disabled) {
    return `<button class="df-radio" type="button" role="radio" aria-checked="false" data-scenario="${esc(scenario)}"${variant != null ? ` data-variant="${esc(variant)}"` : ''}${disabled ? ' disabled' : ''}><span class="df-radio__box"></span><span class="df-radio__text">${esc(title)}</span></button>`;
  }
  function itemHTML(it) {
    if (it.hidden) return '';
    let html = radioHTML(it.id, null, it.title, it.disabled);
    const vars = (it.variants || []).filter((v) => !v.hidden);
    if (vars.length) html += `<div class="df-sub">${vars.map((v) => radioHTML(it.id, v.id, v.title, it.disabled || v.disabled)).join('')}</div>`;
    return html;
  }
  function scenariosHTML(list) {
    let html = '';
    let plain = [];
    const flush = () => {
      if (plain.length) html += `<div class="df-options">${plain.map(itemHTML).join('')}</div>`;
      plain = [];
    };
    for (const e of list || []) {
      if (e.hidden) continue;
      if (e.group != null) {
        flush();
        html += `<div class="df-group">${esc(e.group)}</div><div class="df-options">${(e.items || []).map(itemHTML).join('')}</div>`;
      } else plain.push(e);
    }
    flush();
    return html;
  }

  // ---------- Ссылки и команда ----------
  function infoHTML(links, team) {
    let html = '';
    if (links && links.length) {
      html += `<div class="df-links">${links.map((l) =>
        `<a class="df-link" href="${esc(l.href)}" target="_blank" rel="noopener"><span class="df-link__ico">${ICONS.link}</span><span>${esc(l.title)}</span></a>`).join('')}</div>`;
    }
    for (const t of team || []) {
      const info = (t.name || (t.links && t.links.length))
        ? `<div class="df-team__info">${t.name ? `<span class="df-team__name">${esc(t.name)}</span>` : ''}${(t.links || []).map((l) =>
          `<a class="df-team__link" href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.title)}</a>`).join('')}</div>`
        : '';
      html += `<div class="df-team"><span class="df-team__label">${esc(t.label)}</span>${info}</div>`;
    }
    return html;
  }

  function mount(opts) {
    const o = Object.assign({
      width: 1600, height: 900,          // размер сцены
      headHeight: 80, gap: 16, panelWidth: 300, left: 4, // шапка, зазор сцена–панель, ширина панели, отступ слева
      top: 0,                            // отступ сверху (локальная правка демо; в ките 1.14.0 опции нет)
      head: null, devices: [], device: null, scenarios: [], bottomScenarios: [], links: [], team: [],
      value: null, onChange: null, onDevice: null, onScale: null,
      viewport: null,                    // элемент, под который масштабируется рамка; по умолчанию — окно
    }, opts);
    const stage = o.stage;
    if (!stage) throw new Error('DemoFrame.mount: нужен stage — элемент сцены');

    const root = el('div', 'df');
    root.style.setProperty('--df-w', o.width + 'px');
    root.style.setProperty('--df-h', o.height + 'px');
    root.style.setProperty('--df-head-h', (o.head ? o.headHeight : 0) + 'px');
    root.style.setProperty('--df-gap', o.gap + 'px');
    root.style.setProperty('--df-panel-w', o.panelWidth + 'px');

    const head = o.head ? el('header', 'df-head', headHTML(o.head)) : null;
    const panel = el('aside', 'df-panel');
    panel.setAttribute('aria-label', 'Сценарии демо');

    // устройство и размер
    const top = el('div', 'df-panel__top');
    if (o.devices.length) {
      const devs = el('div', 'df-devices');
      for (const d of o.devices) {
        const b = el('button', 'df-device', ICONS[d.icon] || '');
        b.type = 'button';
        b.dataset.device = d.id;
        b.setAttribute('aria-label', d.label || d.id);
        if (d.disabled) b.disabled = true;
        devs.append(b);
      }
      top.append(devs, el('div', 'df-size'));
    }
    const topCard = el('div', 'df-card df-card--scen', scenariosHTML(o.scenarios));
    topCard.setAttribute('role', 'radiogroup');
    topCard.setAttribute('aria-label', 'Сценарий');
    if (topCard.childElementCount) top.append(topCard);
    panel.append(top);
    if (o.bottomScenarios.length) {
      const bottom = el('div', 'df-card df-card--scen df-card--bottom', scenariosHTML(o.bottomScenarios));
      bottom.setAttribute('role', 'radiogroup');
      bottom.setAttribute('aria-label', 'Сценарий');
      panel.append(bottom);
    }
    const info = infoHTML(o.links, o.team);
    if (info) panel.append(el('div', 'df-card', info));

    if (head) root.append(head);
    root.append(panel);
    document.body.append(root);

    // ---------- Устройство ----------
    let device = null;
    function setDevice(id, silent) {
      const d = o.devices.find((x) => x.id === id);
      if (!d) return;
      device = id;
      for (const b of panel.querySelectorAll('.df-device')) {
        const on = b.dataset.device === id;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on);
      }
      const size = panel.querySelector('.df-size');
      if (size) size.innerHTML = `<span>${esc(d.size || '')}</span><span>${esc(d.name || '')}</span>`;
      if (!silent && o.onDevice) o.onDevice(id);
    }
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('.df-device');
      if (b && !b.disabled && !b.classList.contains('is-on')) setDevice(b.dataset.device);
    });
    if (o.devices.length) setDevice(o.device || (o.devices.find((d) => !d.disabled) || o.devices[0]).id, true);

    // ---------- Сценарии ----------
    // Выбран один сценарий на всю панель. Выбор сценария с вилкой включает его первый подсценарий;
    // у выбранного подсценария отмечен и сам сценарий.
    const radios = [...panel.querySelectorAll('.df-radio')];
    let value = { scenario: null, variant: null };
    function select(scenario, variant, silent) {
      const first = radios.find((r) => r.dataset.scenario === scenario && r.dataset.variant && !r.disabled);
      const v = variant ?? (first ? first.dataset.variant : null);
      for (const r of radios) {
        const on = r.dataset.scenario === scenario && (!r.dataset.variant || r.dataset.variant === v);
        r.classList.toggle('is-on', on);
        r.setAttribute('aria-checked', on);
      }
      const prev = value;
      value = { scenario, variant: v };
      if (!silent && o.onChange) o.onChange(value, prev);
    }
    panel.addEventListener('click', (e) => {
      const r = e.target.closest('.df-radio');
      if (!r || r.disabled || r.classList.contains('is-on')) return;
      select(r.dataset.scenario, r.dataset.variant ?? null);
    });
    if (o.value) select(o.value.scenario, o.value.variant ?? null, true);

    // ---------- Масштаб ----------
    // Шапка, сцена и панель — одно целое: (сцена + зазор + панель) × (шапка + сцена), вписывается в окно.
    let scale = 1;
    stage.style.transformOrigin = '0 0';
    function fit() {
      const vp = o.viewport;
      const vw = (vp ? vp.clientWidth : document.documentElement.clientWidth) - o.left;
      const vh = (vp ? vp.clientHeight : document.documentElement.clientHeight) - o.top;
      const headH = o.head ? o.headHeight : 0;
      scale = Math.max(0.1, Math.min(vw / (o.width + o.gap + o.panelWidth), vh / (headH + o.height)));
      const y = o.top + headH * scale;
      if (head) head.style.transform = `translate(0px, ${o.top}px) scale(${scale})`;
      stage.style.transform = `translate(${o.left}px, ${y}px) scale(${scale})`;
      panel.style.transform = `translate(${o.left + (o.width + o.gap) * scale}px, ${y}px) scale(${scale})`;
      if (o.onScale) o.onScale(scale);
    }
    const ro = new ResizeObserver(fit);
    ro.observe(o.viewport || document.documentElement);
    fit();

    return {
      get scale() { return scale; },
      get value() { return value; },
      get device() { return device; },
      select: (scenario, variant) => select(scenario, variant ?? null),
      setDevice: (id) => setDevice(id),
      fit,
      root, head, panel,
      destroy() { ro.disconnect(); root.remove(); },
    };
  }

  window.DemoFrame = { mount, version: VERSION };
})();
