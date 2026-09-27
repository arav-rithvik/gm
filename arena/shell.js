// GBrain workspace sidebar, shared by every GM page. The GBrain items are
// shown for context only (they live in the real workspace); the GM group
// links between our pages. <body data-page="arena|scoreboard|night|review">.
(() => {
  const icon = (d) => `<svg viewBox="0 0 24 24">${d}</svg>`;
  const I = {
    grid: icon('<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>'),
    chat: icon('<path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3V6a1 1 0 0 1 1-1z"/>'),
    link: icon('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    brain: icon('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
    spark: icon('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
    clock: icon('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'),
    gear: icon('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>'),
    arena: icon('<rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/>'),
    chart: icon('<path d="M5 19V9M12 19V5M19 19v-7"/>'),
    moon: icon('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
    check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  };
  const page = document.body.dataset.page;
  const gb = (ic, label) => `<span class="gb-item">${I[ic]}${label}</span>`;
  const gm = (id, ic, label, extra = '') =>
    `<a class="gb-item gb-sub${page === id ? ' on' : ''}" href="${id === 'arena' ? '/' : '/' + id}">${I[ic]}${label}${extra}</a>`;
  const side = document.createElement('aside');
  side.className = 'gb-side';
  side.innerHTML = `
    <span class="gb-item gb-top">${I.grid}Workspaces</span>
    <div class="gb-ws"><span class="av">R</span><b>Rithvik's workspace</b><span class="run">Running</span></div>
    ${gb('chat', 'Chats')}${gb('link', 'Integrations')}${gb('brain', 'Memory')}${gb('spark', 'Skills')}${gb('clock', 'Schedule')}${gb('gear', 'Settings')}
    <div class="gb-sep"></div>
    <div class="gb-group"><img src="/gm-bot.png" alt=""><b>G<i>M</i></b><span class="gb-new">New</span></div>
    ${gm('arena', 'arena', 'Arena')}
    ${gm('scoreboard', 'chart', 'Scoreboard')}
    ${gm('night', 'moon', 'Tonight')}
    ${gm('review', 'check', 'Review', '<span class="gb-count" id="gb-pending" hidden></span>')}`;
  document.body.prepend(side);

  // Pending-review badge, like an unread count.
  const badge = async () => {
    try {
      const { pending } = await (await fetch('/api/pending')).json();
      const el = document.getElementById('gb-pending');
      el.hidden = pending.length === 0;
      el.textContent = pending.length;
    } catch {}
  };
  badge();
  setInterval(badge, 3000);
})();
