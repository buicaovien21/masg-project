/* =========================================================================
 * MASG Chatbot Widget — vanilla JS
 * Drop-in floating chat button + panel. No build step required.
 *
 * Configure branding, suggested questions, and (optionally) your OpenAI API
 * key in the CONFIG block below. If no key is set, the bot uses a built-in
 * FAQ matcher so it still works offline.
 *
 * The widget hooks into the host site's dark mode by toggling its own
 * `.dark` class whenever <html data-theme="dark"> changes.
 * ========================================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // CONFIG — edit these to customise / rebrand
  // ---------------------------------------------------------------------------
  var CONFIG = {
    companyName: 'MASG',
    assistantName: 'MASG Assistant',
    tagline: 'Local voices. Local actions.',
    welcomeMessage:
      "Hi! I'm the MASG Assistant. Ask me about our Focus Areas, volunteering, the Repair Cafe, or how to get involved in Mount Alexander sustainability programs.",
    suggestedQuestions: [
      'What does MASG do?',
      'How can I volunteer?',
      'Tell me about the Repair Cafe',
      'How do I become a member?',
    ],
    systemPrompt:
      'You are the helpful assistant for Mount Alexander Sustainability Group (MASG), a community sustainability organisation in central Victoria, Australia. Answer concisely (under 120 words unless asked) using a warm, plain-spoken tone. Focus on MASG focus areas (Waste, Energy, Efficiency, Agriculture), volunteering, the Repair Cafe, Bright Sparks, Retrofit Net Zero Housing, Regenerative Agriculture, and Healthy Soils. If a question is off-topic, gently redirect to sustainability and MASG.',
    storageKey: 'masg.chatbot.history.v1',

    // ⚠️  Optional. If you paste a key here it will be visible to anyone who
    // views the page source. For production, leave this blank and set
    // CONFIG.proxyUrl to a backend endpoint that holds the real key.
    openaiApiKey: '',
    proxyUrl: '', // leave blank for local testing — uses openaiApiKey above
  };

  // ---------------------------------------------------------------------------
  // FAQ fallback — used when no API key is set OR the API call fails.
  // ---------------------------------------------------------------------------
  var FAQS = [
    { keywords: ['volunteer', 'help out', 'sign up', 'join'], answer:
      "You can volunteer with MASG in lots of ways — events, the Repair Cafe, workshop assistant, social media, or as a school sustainability ambassador. Head to the **Get Involved** section and pick a path that fits you." },
    { keywords: ['member', 'membership'], answer:
      "Becoming a MASG member supports long-term sustainability programs in the shire. Sign up via the **Become a MASG Member** button under Get Involved." },
    { keywords: ['donate', 'donation', 'support', 'fund'], answer:
      "Donations help fund practical local action and program continuity. You'll find a Donate button under **Get Involved**." },
    { keywords: ['repair', 'cafe', 'fix'], answer:
      "**Repair Cafe** is a volunteer-run program where the community repairs household items together to reduce waste. It's part of our Waste focus area." },
    { keywords: ['bright sparks', 'energy training'], answer:
      "**Bright Sparks** is our volunteer training program for sharing energy knowledge across the shire — part of the Energy focus area." },
    { keywords: ['retrofit', 'home', 'house', 'efficiency'], answer:
      "Our **Retrofit Net Zero Housing** project supports practical home retrofits that reduce energy use and improve comfort." },
    { keywords: ['agriculture', 'soil', 'farm', 'regen'], answer:
      "Our Agriculture focus area covers **Regenerative Agriculture** and the **Healthy Soils Project** — supporting farmers to build healthier, more resilient ecosystems." },
    { keywords: ['net zero', '2030', 'target'], answer:
      "MASG is working toward **Net Zero by 2030** for the Mount Alexander Shire. Live progress is in the **Our Impact** section." },
    { keywords: ['youth', 'young', 'student', 'school', 'teen'], answer:
      "The **Youth Network** is built for 14–25 year-olds with three pathways: Learn (micro-lessons), Volunteer (age-appropriate roles), and Lead (Youth Advisory + facilitation)." },
    { keywords: ['where', 'location', 'map', 'near'], answer:
      "Use the **Map** section to see MASG projects across the shire — Castlemaine, Maldon, Newstead, Campbells Creek and more." },
    { keywords: ['contact', 'email', 'phone', 'address'], answer:
      "You can reach MASG at **info@masg.org.au** or visit 30 Templeton Street, Castlemaine." },
    { keywords: ['what', 'who', 'about', 'mission'], answer:
      "MASG (Mount Alexander Sustainability Group) is the peak sustainability organisation for the Mount Alexander Shire. Since 2006 we've supported coordinated local action across **Waste, Energy, Efficiency, and Agriculture**." },
  ];
  var FALLBACK =
    "I can't reach the AI service right now, but I can still help with the basics: try asking about **volunteering**, the **Repair Cafe**, **membership**, **Net Zero 2030**, or our **Focus Areas**.";

  function answerFromFaq(text) {
    var msg = (text || '').toLowerCase();
    var best = { score: 0, answer: FALLBACK };
    FAQS.forEach(function (entry) {
      var score = 0;
      entry.keywords.forEach(function (k) {
        if (msg.indexOf(k) !== -1) score += 1;
      });
      if (score > best.score) best = { score: score, answer: entry.answer };
    });
    return best.answer;
  }

  // ---------------------------------------------------------------------------
  // Minimal markdown renderer — bold, italic, inline code, fenced code,
  // links, paragraph breaks. Output is HTML-escaped first.
  // ---------------------------------------------------------------------------
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderMarkdown(src) {
    if (!src) return '';
    var s = escapeHtml(src);

    // Fenced code blocks ```lang\n...\n```
    s = s.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, function (_, lang, code) {
      var cls = lang ? ' class="lang-' + lang + '"' : '';
      return '<pre><code' + cls + '>' + code.replace(/\n$/, '') + '</code></pre>';
    });

    // Inline code `x`
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Bold **x** and italic *x*
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

    // Markdown links [text](url)
    s = s.replace(
      /\[([^\]]+)\]\((https?:[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Paragraphs from blank-line separators (skip inside <pre>)
    var parts = s.split(/\n{2,}/);
    s = parts
      .map(function (part) {
        if (/^<pre>/.test(part)) return part;
        return '<p>' + part.replace(/\n/g, '<br>') + '</p>';
      })
      .join('');

    return s;
  }

  // ---------------------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------------------
  function loadHistory() {
    try {
      var raw = window.localStorage.getItem(CONFIG.storageKey);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) { return null; }
  }
  function saveHistory(msgs) {
    try { window.localStorage.setItem(CONFIG.storageKey, JSON.stringify(msgs)); } catch (e) {}
  }
  function clearHistory() {
    try { window.localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // OpenAI / proxy call (with FAQ fallback on failure)
  // ---------------------------------------------------------------------------
  function buildApiMessages(history) {
    // Drop the leading welcome assistant message before sending to the API.
    var trimmed = history.slice();
    if (trimmed.length && trimmed[0].role === 'assistant' && trimmed[0].welcome) trimmed.shift();
    return [{ role: 'system', content: CONFIG.systemPrompt }].concat(
      trimmed.map(function (m) { return { role: m.role, content: m.content }; })
    );
  }

  function sendToApi(history) {
    var lastUser = '';
    for (var i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'user') { lastUser = history[i].content; break; }
    }

    if (CONFIG.proxyUrl) {
      return fetch(CONFIG.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
        .then(function (r) { if (!r.ok) throw new Error('Proxy ' + r.status); return r.json(); })
        .then(function (d) { return { content: d.reply || d.content || '', source: 'proxy' }; })
        .catch(function (err) {
          console.warn('[chatbot] proxy failed:', err);
          return { content: answerFromFaq(lastUser), source: 'faq', error: err.message };
        });
    }

    if (CONFIG.openaiApiKey) {
      return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + CONFIG.openaiApiKey,
        },
        body: JSON.stringify({
          model: CONFIG.openaiModel,
          temperature: 0.4,
          messages: buildApiMessages(history),
        }),
      })
        .then(function (r) {
          if (!r.ok) return r.text().then(function (t) { throw new Error('OpenAI ' + r.status + ': ' + t.slice(0, 120)); });
          return r.json();
        })
        .then(function (d) {
          var content = d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
          return { content: content || answerFromFaq(lastUser), source: content ? 'openai' : 'faq' };
        })
        .catch(function (err) {
          console.warn('[chatbot] OpenAI failed:', err);
          return { content: answerFromFaq(lastUser), source: 'faq', error: err.message };
        });
    }

    // No key / no proxy → use FAQ.
    return Promise.resolve({ content: answerFromFaq(lastUser), source: 'faq' });
  }

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'aria' && typeof attrs[k] === 'object') {
          Object.keys(attrs[k]).forEach(function (a) { node.setAttribute('aria-' + a, attrs[k][a]); });
        } else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  function icon(path, viewBox) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', viewBox || '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', path);
    svg.appendChild(p);
    return svg;
  }

  // ---------------------------------------------------------------------------
  // Widget
  // ---------------------------------------------------------------------------
  function init() {
    // Container — mount inside <body> so it can be `position: fixed`.
    var root = el('div', { id: 'masg-chatbot' });
    document.body.appendChild(root);

    // ----- State ------------------------------------------------------------
    var state = {
      open: false,
      loading: false,
      messages: loadHistory() || [
        { id: id(), role: 'assistant', welcome: true, content: CONFIG.welcomeMessage, ts: Date.now() },
      ],
      error: null,
      unread: 0,
    };

    function id() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

    // ----- DOM --------------------------------------------------------------
    // FAB
    var iconOpen = icon('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z');
    iconOpen.classList.add('mcb-icon-open');
    var iconClose = icon('M18 6 6 18 M6 6l12 12');
    iconClose.classList.add('mcb-icon-close');
    var badge = el('span', { class: 'mcb-badge', hidden: '' }, ['0']);
    var fab = el(
      'button',
      {
        class: 'mcb-fab',
        type: 'button',
        'data-open': 'false',
        'aria-label': 'Open chat',
        'aria-expanded': 'false',
        onClick: toggleOpen,
      },
      [iconOpen, iconClose, badge]
    );

    // Header
    var avatar = el('div', { class: 'mcb-avatar' }, [CONFIG.companyName.slice(0, 1)]);
    var titleBox = el('div', { class: 'mcb-title' }, [
      el('h3', {}, [CONFIG.assistantName]),
      el('p', {}, [CONFIG.tagline]),
    ]);
    var themeBtn = el(
      'button',
      { class: 'mcb-iconbtn', type: 'button', title: 'Toggle theme', 'aria-label': 'Toggle theme', onClick: toggleTheme },
      [icon('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z')]
    );
    var clearBtn = el(
      'button',
      { class: 'mcb-iconbtn', type: 'button', title: 'Clear conversation', 'aria-label': 'Clear conversation', onClick: clearConversation },
      [icon('M3 12a9 9 0 1 0 3-6.7 M3 4v5h5')]
    );
    var closeBtn = el(
      'button',
      { class: 'mcb-iconbtn', type: 'button', title: 'Close', 'aria-label': 'Close chat', onClick: function () { setOpen(false); } },
      [icon('M18 6 6 18 M6 6l12 12')]
    );
    var header = el('div', { class: 'mcb-header' }, [avatar, titleBox, themeBtn, clearBtn, closeBtn]);

    // Messages
    var messagesEl = el('div', { class: 'mcb-messages', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions' });

    // Suggestions
    var suggestionsEl = el('div', { class: 'mcb-suggestions' });
    CONFIG.suggestedQuestions.forEach(function (q) {
      suggestionsEl.appendChild(
        el('button', { class: 'mcb-chip', type: 'button', onClick: function () { send(q); } }, [q])
      );
    });

    // Input
    var textarea = el('textarea', {
      rows: '1',
      placeholder: 'Type your message…',
      'aria-label': 'Message',
      onInput: function () {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
        sendBtn.disabled = !textarea.value.trim() || state.loading;
      },
      onKeydown: function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          send(textarea.value);
        }
      },
    });
    var sendBtn = el(
      'button',
      { class: 'mcb-send', type: 'submit', 'aria-label': 'Send message', disabled: '' },
      [icon('M22 2 11 13 M22 2l-7 20-4-9-9-4 20-7z')]
    );
    var inputForm = el(
      'form',
      {
        class: 'mcb-input',
        onSubmit: function (e) { e.preventDefault(); send(textarea.value); },
      },
      [textarea, sendBtn]
    );

    var panel = el(
      'div',
      { class: 'mcb-panel', role: 'dialog', 'aria-label': CONFIG.assistantName, 'data-open': 'false' },
      [header, messagesEl, suggestionsEl, inputForm]
    );

    root.appendChild(panel);
    root.appendChild(fab);

    // ----- Render -----------------------------------------------------------
    function render() {
      messagesEl.innerHTML = '';
      state.messages.forEach(function (m) {
        var bubble = el('div', { class: 'mcb-bubble markdown' });
        bubble.innerHTML = renderMarkdown(m.content);
        var row = el('div', { class: 'mcb-row ' + (m.role === 'user' ? 'user' : 'bot') }, [bubble]);
        messagesEl.appendChild(row);
      });
      if (state.loading) {
        var typingRow = el('div', { class: 'mcb-row bot' }, [
          el('div', { class: 'mcb-typing', 'aria-label': 'Assistant is typing' }, [
            el('span'), el('span'), el('span'),
          ]),
        ]);
        messagesEl.appendChild(typingRow);
      }
      if (state.error) {
        messagesEl.appendChild(
          el('div', { class: 'mcb-error' }, ['Connection issue — showing an offline answer.'])
        );
      }

      // Hide suggestions after first user message.
      var hasUser = state.messages.some(function (m) { return m.role === 'user'; });
      suggestionsEl.style.display = hasUser || state.loading ? 'none' : 'flex';

      // Auto-scroll
      requestAnimationFrame(function () {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      });

      // Unread badge
      if (state.unread > 0 && !state.open) {
        badge.textContent = state.unread > 9 ? '9+' : String(state.unread);
        badge.removeAttribute('hidden');
      } else {
        badge.setAttribute('hidden', '');
      }
    }

    // ----- Actions ----------------------------------------------------------
    function setOpen(open) {
      state.open = open;
      panel.setAttribute('data-open', open ? 'true' : 'false');
      fab.setAttribute('data-open', open ? 'true' : 'false');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
      if (open) {
        state.unread = 0;
        setTimeout(function () { textarea.focus(); }, 200);
      }
      render();
    }
    function toggleOpen() { setOpen(!state.open); }

    function send(text) {
      var trimmed = (text || '').trim();
      if (!trimmed || state.loading) return;
      textarea.value = '';
      textarea.style.height = 'auto';
      sendBtn.disabled = true;
      state.error = null;
      state.messages.push({ id: id(), role: 'user', content: trimmed, ts: Date.now() });
      state.loading = true;
      render();
      saveHistory(state.messages);

      sendToApi(state.messages).then(function (result) {
        state.messages.push({
          id: id(),
          role: 'assistant',
          content: result.content,
          ts: Date.now(),
          source: result.source,
        });
        state.loading = false;
        if (result.error) state.error = result.error;
        if (!state.open) state.unread += 1;
        render();
        saveHistory(state.messages);
      });
    }

    function clearConversation() {
      clearHistory();
      state.messages = [
        { id: id(), role: 'assistant', welcome: true, content: CONFIG.welcomeMessage, ts: Date.now() },
      ];
      state.error = null;
      render();
    }

    function toggleTheme() {
      root.classList.toggle('dark');
    }

    // Mirror the host site's theme attribute if one is used (the MASG site
    // toggles a `data-theme="dark"` attribute on <html> from script.js).
    function syncHostTheme() {
      var hostDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (hostDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    syncHostTheme();
    new MutationObserver(syncHostTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
