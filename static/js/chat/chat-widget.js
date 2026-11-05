/**
 * Myco Website Assistant — Floating Widget & Interactive Conversation Controller
 *
 * Implements:
 * - Floating Launcher and Chat Panel with accessible ARIA semantics
 * - 2-minute proactive engagement popup with tab visibility awareness
 * - Deterministic FAQ matching and ambiguity clarification
 * - Lead capture escalation form on unknown queries
 * - Full session-level persistence and clean lifecycle management
 */
(function (global) {
  'use strict';

  var config = global.MycoChatConfig || {};
  var faqs = global.MycoChatFaqs || [];
  var matcher = global.MycoFaqMatcher ? new global.MycoFaqMatcher.FAQMatcher(faqs, config) : null;

  var ChatWidget = function () {
    this.isOpen = false;
    this.messages = [];
    this.lastUserQuestion = '';
    this.autoPopupTimer = null;
    this.activeTimeInterval = null;
    this.elapsedActiveSeconds = 0;
    this.isSubmittingEscalation = false;

    // Typewriter Callout State
    this.callout = null;
    this.typewriterTextEl = null;
    this.typewriterTimeout = null;
    this.typewriterPhraseIdx = 0;
    this.typewriterCharIdx = 0;
    this.isTypingCallout = false;
    this.calloutDismissed = false;

    // DOM references
    this.container = null;
    this.launcher = null;
    this.panel = null;
    this.messagesContainer = null;
    this.input = null;
    this.sendBtn = null;
    this.pingDot = null;

    this.init();
  };

  ChatWidget.prototype.init = function () {
    if (document.getElementById('myco-chat-widget-root')) {
      return; // Already initialized
    }

    this.loadSessionState();
    this.buildDOM();
    this.bindEvents();
    this.initAutoPopup();
    this.renderInitialGreeting();
    this.initTypewriter();
  };

  ChatWidget.prototype.loadSessionState = function () {
    try {
      var keys = config.storageKeys || {};
      var storedSec = sessionStorage.getItem(keys.activeSeconds);
      if (storedSec) {
        this.elapsedActiveSeconds = parseInt(storedSec, 10) || 0;
      }
    } catch (e) {
      this.elapsedActiveSeconds = 0;
    }
  };

  ChatWidget.prototype.saveSessionState = function () {
    try {
      var keys = config.storageKeys || {};
      sessionStorage.setItem(keys.activeSeconds, String(this.elapsedActiveSeconds));
    } catch (e) { }
  };

  ChatWidget.prototype.isSessionDismissedOrOpened = function () {
    try {
      var keys = config.storageKeys || {};
      return Boolean(
        sessionStorage.getItem(keys.opened) === 'true' ||
        sessionStorage.getItem(keys.dismissed) === 'true'
      );
    } catch (e) {
      return false;
    }
  };

  ChatWidget.prototype.markOpened = function () {
    try {
      var keys = config.storageKeys || {};
      sessionStorage.setItem(keys.opened, 'true');
    } catch (e) { }
    this.stopAutoPopupTimer();
  };

  ChatWidget.prototype.markDismissed = function () {
    try {
      var keys = config.storageKeys || {};
      sessionStorage.setItem(keys.dismissed, 'true');
    } catch (e) { }
    this.stopAutoPopupTimer();
  };

  // --------------------------------------------------------------------------
  // Auto-Popup Tracking
  // --------------------------------------------------------------------------
  ChatWidget.prototype.initAutoPopup = function () {
    var autoPopup = config.autoPopup || {};
    if (!autoPopup.enabled) return;
    if (this.isSessionDismissedOrOpened()) return;

    var self = this;
    var targetSeconds = autoPopup.delaySeconds || 120;

    // Track active elapsed seconds only when the tab is visible
    this.activeTimeInterval = setInterval(function () {
      if (document.visibilityState === 'visible') {
        self.elapsedActiveSeconds++;
        self.saveSessionState();

        if (self.elapsedActiveSeconds >= targetSeconds) {
          self.triggerAutoPopup();
        }
      }
    }, 1000);
  };

  ChatWidget.prototype.triggerAutoPopup = function () {
    this.stopAutoPopupTimer();
    if (this.isOpen || this.isSessionDismissedOrOpened()) return;

    // Check tab visibility
    if (document.visibilityState === 'visible') {
      this.openChat();
      this.markOpened();
    }
  };

  ChatWidget.prototype.stopAutoPopupTimer = function () {
    if (this.activeTimeInterval) {
      clearInterval(this.activeTimeInterval);
      this.activeTimeInterval = null;
    }
  };

  // --------------------------------------------------------------------------
  // Typewriter Greeting & Hover Callout
  // --------------------------------------------------------------------------
  ChatWidget.prototype.initTypewriter = function () {
    var twConfig = config.typewriter || {};
    if (!twConfig.enabled) return;

    var self = this;
    var initialDelay = twConfig.initialDelayMs || 900;

    // Start typewriter effect after visitor lands on the website
    setTimeout(function () {
      if (!self.isOpen && !self.calloutDismissed) {
        self.showCalloutAndType();
      }
    }, initialDelay);
  };

  ChatWidget.prototype.showCalloutAndType = function () {
    if (this.isOpen || this.calloutDismissed) return;
    if (this.callout) {
      this.callout.classList.add('is-visible');
    }
    if (!this.isTypingCallout) {
      this.startTypingCurrentPhrase();
    }
  };

  ChatWidget.prototype.startTypingCurrentPhrase = function () {
    var self = this;
    var twConfig = config.typewriter || {};
    var phrases = twConfig.phrases || ["Hi, I'm Myco Assistant! Ask me anything 👋"];
    var phrase = phrases[this.typewriterPhraseIdx % phrases.length];
    var speed = twConfig.typingSpeedMs || 40;
    var holdDuration = twConfig.holdDurationMs || 4500;

    clearTimeout(this.typewriterTimeout);
    this.isTypingCallout = true;
    this.typewriterCharIdx = 0;
    if (this.typewriterTextEl) {
      this.typewriterTextEl.textContent = '';
    }

    var typeNextChar = function () {
      if (self.isOpen || !self.typewriterTextEl) {
        self.isTypingCallout = false;
        return;
      }

      if (self.typewriterCharIdx < phrase.length) {
        self.typewriterTextEl.textContent = phrase.slice(0, self.typewriterCharIdx + 1);
        self.typewriterCharIdx++;
        self.typewriterTimeout = setTimeout(typeNextChar, speed);
      } else {
        self.isTypingCallout = false;
        if (phrases.length > 1) {
          self.typewriterTimeout = setTimeout(function () {
            if (!self.isOpen && !self.calloutDismissed) {
              self.typewriterPhraseIdx = (self.typewriterPhraseIdx + 1) % phrases.length;
              self.startTypingCurrentPhrase();
            }
          }, holdDuration);
        }
      }
    };

    typeNextChar();
  };

  // --------------------------------------------------------------------------
  // DOM Construction
  // --------------------------------------------------------------------------
  ChatWidget.prototype.buildDOM = function () {
    var root = document.createElement('div');
    root.id = 'myco-chat-widget-root';

    // Launcher button
    var launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.className = 'myco-chat-launcher';
    launcher.setAttribute('aria-label', 'Open ' + (config.assistantName || 'Myco Assistant'));
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.setAttribute('aria-controls', 'myco-chat-panel');

    launcher.innerHTML = [
      '<span class="myco-chat-launcher__icon-open" aria-hidden="true">',
      '  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
      '  </svg>',
      '</span>',
      '<span class="myco-chat-launcher__icon-close" aria-hidden="true">',
      '  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '    <line x1="18" y1="6" x2="6" y2="18"></line>',
      '    <line x1="6" y1="6" x2="18" y2="18"></line>',
      '  </svg>',
      '</span>',
      '<span class="myco-chat-launcher__ping" aria-hidden="true"></span>'
    ].join('');

    // Typewriter Callout Speech Bubble
    var avatarUrl = config.assistantAvatar || '/assets/myco-icon.svg';
    var fallbackAvatarUrl = config.assistantAvatarFallback || '/assets/myco-icon.svg';
    var callout = document.createElement('div');
    callout.id = 'myco-chat-callout';
    callout.className = 'myco-chat-callout';
    callout.setAttribute('role', 'status');
    callout.setAttribute('aria-live', 'polite');
    callout.setAttribute('title', 'Click to chat with ' + (config.assistantName || 'Myco Assistant'));

    callout.innerHTML = [
      '<span class="myco-chat-callout__avatar" aria-hidden="true">',
      '  <img src="' + avatarUrl + '" onerror="this.src=\'' + fallbackAvatarUrl + '\'" alt="' + (config.assistantName || 'Myco Assistant') + ' avatar" />',
      '</span>',
      '<div class="myco-chat-callout__content">',
      '  <div class="myco-chat-callout__header">',
      '    <span class="myco-chat-callout__name">' + (config.assistantName || 'Myco Assistant') + '</span>',
      '  </div>',
      '  <div class="myco-chat-callout__text-line">',
      '    <span class="myco-typewriter-text" id="myco-typewriter-text"></span>',
      '    <span class="myco-typewriter-cursor" aria-hidden="true">|</span>',
      '  </div>',
      '</div>',
      '<button type="button" class="myco-chat-callout__close" id="myco-chat-callout-close" title="Dismiss" aria-label="Dismiss message">×</button>'
    ].join('');

    // Chat Panel
    var panel = document.createElement('section');
    panel.id = 'myco-chat-panel';
    panel.className = 'myco-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', config.assistantName || 'Myco Assistant');
    panel.setAttribute('aria-hidden', 'true');

    panel.innerHTML = [
      '<header class="myco-chat-header">',
      '  <div class="myco-chat-header__info">',
      '    <div class="myco-chat-header__avatar">',
      '      <img src="' + avatarUrl + '" onerror="this.src=\'' + fallbackAvatarUrl + '\'" alt="' + (config.assistantName || 'Myco Assistant') + ' Avatar" />',
      '    </div>',
      '    <div class="myco-chat-header__details">',
      '      <h3>' + (config.assistantName || 'Myco Assistant') + '</h3>',
      '    </div>',
      '  </div>',
      '  <div class="myco-chat-header__actions">',
      '    <button type="button" class="myco-chat-header__btn" id="myco-chat-btn-reset" title="Reset conversation" aria-label="Reset conversation">',
      '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '        <polyline points="1 4 1 10 7 10"></polyline>',
      '        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>',
      '      </svg>',
      '    </button>',
      '    <button type="button" class="myco-chat-header__btn" id="myco-chat-btn-close" title="Close assistant" aria-label="Close assistant">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <line x1="18" y1="6" x2="6" y2="18"></line>',
      '        <line x1="6" y1="6" x2="18" y2="18"></line>',
      '      </svg>',
      '    </button>',
      '  </div>',
      '</header>',
      '<div class="myco-chat-messages" id="myco-chat-messages-container" role="log" aria-live="polite"></div>',
      '<footer class="myco-chat-footer">',
      '  <div class="myco-chat-input-wrapper">',
      '    <textarea id="myco-chat-input" class="myco-chat-input" placeholder="' + (config.messages && config.messages.inputPlaceholder ? config.messages.inputPlaceholder : 'Ask Myco Assistant a question...') + '" rows="1" aria-label="Type your message"></textarea>',
      '    <button type="button" id="myco-chat-btn-send" class="myco-chat-btn-send" aria-label="Send message" disabled>',
      '      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <line x1="22" y1="2" x2="11" y2="13"></line>',
      '        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
      '      </svg>',
      '    </button>',
      '  </div>',
      '  <p class="myco-chat-footer__subtext">' + (config.assistantName || 'Myco Assistant') + ' can make mistakes. Check important info.</p>',
      '</footer>'
    ].join('');

    root.appendChild(callout);
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);

    this.container = root;
    this.callout = callout;
    this.typewriterTextEl = callout.querySelector('#myco-typewriter-text');
    this.launcher = launcher;
    this.panel = panel;
    this.messagesContainer = panel.querySelector('#myco-chat-messages-container');
    this.input = panel.querySelector('#myco-chat-input');
    this.sendBtn = panel.querySelector('#myco-chat-btn-send');
    this.pingDot = launcher.querySelector('.myco-chat-launcher__ping');
  };

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------
  ChatWidget.prototype.bindEvents = function () {
    var self = this;

    // Toggle open / close
    this.launcher.addEventListener('click', function () {
      if (self.isOpen) {
        self.closeChat(true);
      } else {
        self.openChat();
      }
    });

    // Close button
    var closeBtn = this.panel.querySelector('#myco-chat-btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        self.closeChat(true);
      });
    }

    // Reset button
    var resetBtn = this.panel.querySelector('#myco-chat-btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        self.resetConversation();
      });
    }

    // Input changes & keydown
    this.input.addEventListener('input', function () {
      var val = self.input.value.trim();
      self.sendBtn.disabled = val.length === 0;
      // Auto-resize textarea
      self.input.style.height = 'auto';
      self.input.style.height = Math.min(self.input.scrollHeight, 80) + 'px';
    });

    this.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        self.handleSend();
      }
    });

    this.sendBtn.addEventListener('click', function () {
      self.handleSend();
    });

    // Callout click opens chat, unless clicking dismiss button
    if (this.callout) {
      this.callout.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('myco-chat-callout__close')) {
          e.stopPropagation();
          self.calloutDismissed = true;
          self.callout.classList.remove('is-visible');
          clearTimeout(self.typewriterTimeout);
          return;
        }
        self.openChat();
      });

      // Hover on launcher or callout area triggers / shows typewriter callout
      var handleHoverTrigger = function () {
        if (!self.isOpen && !self.calloutDismissed) {
          self.showCalloutAndType();
        }
      };

      this.launcher.addEventListener('mouseenter', handleHoverTrigger);
      this.callout.addEventListener('mouseenter', handleHoverTrigger);
    }

    // Global keyboard control: Escape key to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && self.isOpen) {
        self.closeChat(true);
      }
    });

    // Before unload: save session active time
    window.addEventListener('beforeunload', function () {
      self.saveSessionState();
    });
  };

  // --------------------------------------------------------------------------
  // Widget Open / Close
  // --------------------------------------------------------------------------
  ChatWidget.prototype.openChat = function () {
    this.isOpen = true;
    if (this.callout) {
      this.callout.classList.remove('is-visible');
    }
    clearTimeout(this.typewriterTimeout);

    this.panel.classList.add('is-open');
    this.panel.setAttribute('aria-hidden', 'false');
    this.launcher.setAttribute('aria-expanded', 'true');
    this.launcher.setAttribute('aria-label', 'Close ' + (config.assistantName || 'Myco Assistant'));

    if (this.pingDot) {
      this.pingDot.style.display = 'none';
    }

    this.markOpened();

    if (document.body) {
      document.body.classList.add('myco-chat-open');
    }

    var self = this;
    setTimeout(function () {
      if (window.innerWidth > 640) {
        self.input.focus();
      }
      self.scrollToBottom();
    }, 150);
  };

  ChatWidget.prototype.closeChat = function (explicitDismissal) {
    this.isOpen = false;
    this.panel.classList.remove('is-open');
    this.panel.setAttribute('aria-hidden', 'true');
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.setAttribute('aria-label', 'Open ' + (config.assistantName || 'Myco Assistant'));

    if (document.body) {
      document.body.classList.remove('myco-chat-open');
    }

    if (explicitDismissal) {
      this.markDismissed();
    }
  };

  ChatWidget.prototype.resetConversation = function () {
    this.messages = [];
    this.messagesContainer.innerHTML = '';
    this.renderInitialGreeting();
    this.input.value = '';
    this.sendBtn.disabled = true;
    if (window.innerWidth > 640) {
      this.input.focus();
    }
  };

  ChatWidget.prototype.scrollToBottom = function () {
    var self = this;
    requestAnimationFrame(function () {
      if (self.messagesContainer) {
        self.messagesContainer.scrollTop = self.messagesContainer.scrollHeight;
      }
    });
  };

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // Safe Markdown & Structured Evidence Renderer
  // --------------------------------------------------------------------------
  ChatWidget.prototype.renderMarkdown = function (markdownText) {
    if (!markdownText) return '';

    // 1. Sanitize HTML entities to eliminate XSS risks
    var escaped = String(markdownText)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    var lines = escaped.split('\n');
    var html = [];
    var inTable = false;
    var tableRows = [];
    var inList = false;

    var flushTable = function () {
      if (!inTable) return;
      if (tableRows.length > 0) {
        var tableHtml = ['<div class="myco-chat-table-wrapper"><table class="myco-chat-table">'];
        tableRows.forEach(function (row, idx) {
          if (idx === 0) {
            tableHtml.push('<thead><tr>');
            row.forEach(function (cell) {
              tableHtml.push('<th>' + cell + '</th>');
            });
            tableHtml.push('</tr></thead><tbody>');
          } else {
            tableHtml.push('<tr>');
            row.forEach(function (cell) {
              tableHtml.push('<td>' + cell + '</td>');
            });
            tableHtml.push('</tr>');
          }
        });
        tableHtml.push('</tbody></table></div>');
        html.push(tableHtml.join(''));
      }
      tableRows = [];
      inTable = false;
    };

    var flushList = function () {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
    };

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();

      // Markdown Tables (| cell | cell |)
      if (line.startsWith('|') && line.endsWith('|')) {
        flushList();
        // Separator line (|---|---|)
        if (/^\|(\s*[-:]+[-| :]*)\|$/.test(line)) {
          continue;
        }
        var cells = line
          .slice(1, -1)
          .split('|')
          .map(function (c) {
            return c.trim();
          });
        tableRows.push(cells);
        inTable = true;
        continue;
      } else {
        flushTable();
      }

      // Empty line
      if (!line) {
        flushList();
        continue;
      }

      // Horizontal separator
      if (line === '---' || line === '***') {
        flushList();
        html.push('<hr style="border:none;border-top:1px solid var(--border,#D4DEDA);margin:8px 0;" />');
        continue;
      }

      // Headings
      if (line.startsWith('### ')) {
        flushList();
        html.push('<h4 class="myco-chat-heading">' + line.slice(4) + '</h4>');
        continue;
      }
      if (line.startsWith('## ')) {
        flushList();
        html.push('<h3 class="myco-chat-heading">' + line.slice(3) + '</h3>');
        continue;
      }

      // Source Tag [Source: Document > Section]
      line = line.replace(/\[Source:\s*([^\]]+)\]/g, function (match, src) {
        return '<span class="myco-chat-source-tag"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Source: ' + src + '</span>';
      });

      // Inline styles: Bold, Italic, Inline Code
      line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      line = line.replace(/`([^`]+)`/g, '<code class="myco-chat-code">$1</code>');

      // Unordered lists (- or *)
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          html.push('<ul class="myco-chat-list">');
          inList = true;
        }
        html.push('<li>' + line.slice(2) + '</li>');
        continue;
      } else {
        flushList();
      }

      // Regular paragraph
      html.push('<p class="myco-chat-p">' + line + '</p>');
    }

    flushTable();
    flushList();

    return html.join('');
  };

  // --------------------------------------------------------------------------
  // Rendering Message Elements
  // --------------------------------------------------------------------------
  ChatWidget.prototype.renderInitialGreeting = function () {
    var welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'myco-chat-welcome';

    var greeting = config.messages && config.messages.greeting ? config.messages.greeting : "Hi there! 👋 I'm **Myco Assistant**. How can I help you today?";

    welcomeDiv.innerHTML = [
      '<span class="myco-chat-welcome__badge">' + (config.assistantName || 'Myco Assistant') + '</span>',
      '<div class="myco-chat-welcome__text">' + this.renderMarkdown(greeting) + '</div>',
      '<div class="myco-chat-suggestions">',
      '  <span class="myco-chat-suggestions__label">Suggested questions:</span>',
      '</div>'
    ].join('');

    var suggestionsContainer = welcomeDiv.querySelector('.myco-chat-suggestions');
    var starterQuestions = config.starterQuestions || [];

    var self = this;
    starterQuestions.forEach(function (q) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'myco-chat-pill';
      pill.textContent = q;
      pill.addEventListener('click', function () {
        self.askQuestion(q);
      });
      suggestionsContainer.appendChild(pill);
    });

    this.messagesContainer.appendChild(welcomeDiv);
  };

  ChatWidget.prototype.formatTime = function () {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    var strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return hours + ':' + strMinutes + ' ' + ampm;
  };

  ChatWidget.prototype.appendMessage = function (sender, text, sources, status) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'myco-chat-msg ' + (sender === 'user' ? 'myco-chat-msg--user' : 'myco-chat-msg--bot');

    // Assistant message header with AI badge
    if (sender !== 'user') {
      var header = document.createElement('div');
      header.className = 'myco-chat-msg-header';
      header.innerHTML = [
        '<span class="myco-chat-msg-author">' + (config.assistantName || 'Myco Assistant') + '</span>',
        '<span class="myco-chat-ai-badge" title="Generated by AI">AI</span>'
      ].join('');
      msgDiv.appendChild(header);
    }

    var bubble = document.createElement('div');
    bubble.className = 'myco-chat-bubble';

    if (sender === 'user') {
      bubble.textContent = text; // Safe textContent for user input
    } else {
      bubble.innerHTML = this.renderMarkdown(text);
    }

    var time = document.createElement('span');
    time.className = 'myco-chat-time';
    time.textContent = this.formatTime();

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(time);
    this.messagesContainer.appendChild(msgDiv);

    this.messages.push({ sender: sender, text: text, time: time.textContent });
    this.scrollToBottom();
  };

  ChatWidget.prototype.showTypingIndicator = function () {
    var typingDiv = document.createElement('div');
    typingDiv.className = 'myco-chat-typing';
    typingDiv.id = 'myco-chat-typing-indicator';
    typingDiv.innerHTML = [
      '<span class="myco-chat-typing__dot"></span>',
      '<span class="myco-chat-typing__dot"></span>',
      '<span class="myco-chat-typing__dot"></span>'
    ].join('');
    this.messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
    return typingDiv;
  };

  ChatWidget.prototype.removeTypingIndicator = function () {
    var el = document.getElementById('myco-chat-typing-indicator');
    if (el) el.remove();
  };

  // --------------------------------------------------------------------------
  // Message Handling & RAG Pipeline Integration
  // --------------------------------------------------------------------------
  ChatWidget.prototype.handleSend = function () {
    var text = this.input.value.trim();
    if (!text) return;

    this.input.value = '';
    this.input.style.height = 'auto';
    this.sendBtn.disabled = true;

    this.askQuestion(text);
  };

  ChatWidget.prototype.askQuestion = function (questionText) {
    this.lastUserQuestion = questionText;
    this.appendMessage('user', questionText);

    this.showTypingIndicator();
    this.processAssistantResponse(questionText);
  };

  ChatWidget.prototype.processAssistantResponse = function (query) {
    var self = this;
    var endpoint = config.askEndpoint || '/api/chat/ask';

    var payload = {
      question: query,
      conversationContext: this.messages.slice(-6).map(function (m) {
        return { sender: m.sender, text: m.text };
      })
    };

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (res) {
        self.removeTypingIndicator();

        if (res.ok && res.data) {
          var resp = res.data;
          var status = resp.status; // ANSWERED | UNKNOWN | RESTRICTED | CLARIFICATION_NEEDED | ERROR
          var answer = resp.answer || config.messages.fallback;

          if (status === 'ANSWERED') {
            self.appendMessage('bot', answer, resp.sources, status);
          } else if (status === 'RESTRICTED') {
            self.appendMessage('bot', answer, [], status);
            if (resp.canEscalate) {
              self.renderLeadCaptureForm(query, "Request Architecture Briefing / Contact Team");
            }
          } else if (status === 'UNKNOWN') {
            self.appendMessage('bot', answer, [], status);
            if (resp.canEscalate) {
              self.renderLeadCaptureForm(query);
            }
          } else if (status === 'CLARIFICATION_NEEDED') {
            self.appendMessage('bot', answer, [], status);
            if (config.starterQuestions && config.starterQuestions.length > 0) {
              var fakeResult = {
                answer: "Here are some topics from our verified documentation:",
                clarificationOptions: config.starterQuestions.slice(0, 3).map(function (q) {
                  return { question: q };
                })
              };
              self.renderClarification(fakeResult);
            }
          } else {
            self.appendMessage('bot', answer, resp.sources, status);
            if (resp.canEscalate) {
              self.renderLeadCaptureForm(query);
            }
          }
        } else {
          self.handleOfflineOrErrorFallback(query);
        }
      })
      .catch(function (err) {
        self.removeTypingIndicator();
        self.handleOfflineOrErrorFallback(query);
      });
  };

  ChatWidget.prototype.handleOfflineOrErrorFallback = function (query) {
    if (matcher) {
      var result = matcher.findAnswer(query);
      if (result.status === 'CONFIDENT') {
        this.appendMessage('bot', result.answer);
        return;
      } else if (result.status === 'AMBIGUOUS') {
        this.renderClarification(result);
        return;
      }
    }
    this.appendMessage('bot', config.messages.fallback);
    this.renderLeadCaptureForm(query);
  };

  ChatWidget.prototype.renderClarification = function (result) {
    var wrap = document.createElement('div');
    wrap.className = 'myco-chat-msg myco-chat-msg--bot';

    var bubble = document.createElement('div');
    bubble.className = 'myco-chat-bubble';
    bubble.textContent = result.answer;

    var optionsContainer = document.createElement('div');
    optionsContainer.className = 'myco-chat-suggestions';
    optionsContainer.style.marginTop = '8px';

    var self = this;
    (result.clarificationOptions || []).forEach(function (faq) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'myco-chat-pill';
      pill.textContent = faq.question;
      pill.addEventListener('click', function () {
        self.askQuestion(faq.question);
      });
      optionsContainer.appendChild(pill);
    });

    bubble.appendChild(optionsContainer);
    wrap.appendChild(bubble);

    var time = document.createElement('span');
    time.className = 'myco-chat-time';
    time.textContent = this.formatTime();
    wrap.appendChild(time);

    this.messagesContainer.appendChild(wrap);
    this.scrollToBottom();
  };

  // --------------------------------------------------------------------------
  // Lead Capture & Escalation Form
  // --------------------------------------------------------------------------
  ChatWidget.prototype.renderLeadCaptureForm = function (prefilledQuestion, customTitle) {
    var card = document.createElement('div');
    card.className = 'myco-chat-escalation-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Contact details form');

    var cardTitle = customTitle || 'Would you like our engineering team to follow up?';
    var cardDesc = customTitle
      ? 'Leave your contact details and our team will follow up directly regarding architectural details.'
      : 'Leave your contact details and our team will get back to you with verified answers.';

    card.innerHTML = [
      '<h4 class="myco-chat-escalation-card__title">' + cardTitle + '</h4>',
      '<p class="myco-chat-escalation-card__desc">' + cardDesc + '</p>',
      '<form class="myco-chat-form" novalidate>',
      '  <div class="myco-chat-form__group">',
      '    <label class="myco-chat-form__label" for="esc-name">Name <span class="req">*</span></label>',
      '    <input type="text" id="esc-name" class="myco-chat-form__input" placeholder="Jane Doe" required maxlength="120" />',
      '    <span class="myco-chat-form__error-text" style="display:none"></span>',
      '  </div>',
      '  <div class="myco-chat-form__group">',
      '    <label class="myco-chat-form__label" for="esc-email">Work Email <span class="req">*</span></label>',
      '    <input type="email" id="esc-email" class="myco-chat-form__input" placeholder="jane@company.com" required maxlength="254" />',
      '    <span class="myco-chat-form__error-text" style="display:none"></span>',
      '  </div>',
      '  <div class="myco-chat-form__group">',
      '    <label class="myco-chat-form__label" for="esc-question">Your Question <span class="req">*</span></label>',
      '    <textarea id="esc-question" class="myco-chat-form__textarea" rows="2" maxlength="2000" required></textarea>',
      '    <span class="myco-chat-form__error-text" style="display:none"></span>',
      '  </div>',
      '  <div class="myco-chat-form__group">',
      '    <label class="myco-chat-form__label" for="esc-company">Company (Optional)</label>',
      '    <input type="text" id="esc-company" class="myco-chat-form__input" placeholder="Acme Corp" maxlength="150" />',
      '  </div>',
      '  <div class="myco-chat-form__group">',
      '    <label class="myco-chat-form__label" for="esc-phone">Phone / WhatsApp (Optional)</label>',
      '    <input type="tel" id="esc-phone" class="myco-chat-form__input" placeholder="+1 (555) 000-0000" maxlength="50" />',
      '  </div>',
      '  <label class="myco-chat-form__consent">',
      '    <input type="checkbox" id="esc-consent" checked />',
      '    <span>I agree to have Myco contact me regarding this inquiry.</span>',
      '  </label>',
      '  <div class="myco-chat-form__actions">',
      '    <button type="submit" class="myco-chat-btn-submit">',
      '      <span>Send to Team</span>',
      '    </button>',
      '    <button type="button" class="myco-chat-btn-cancel">Continue Chatting</button>',
      '  </div>',
      '</form>'
    ].join('');

    var form = card.querySelector('form');
    var nameInput = card.querySelector('#esc-name');
    var emailInput = card.querySelector('#esc-email');
    var questionInput = card.querySelector('#esc-question');
    var companyInput = card.querySelector('#esc-company');
    var phoneInput = card.querySelector('#esc-phone');
    var consentInput = card.querySelector('#esc-consent');
    var submitBtn = card.querySelector('.myco-chat-btn-submit');
    var cancelBtn = card.querySelector('.myco-chat-btn-cancel');

    // Pre-fill question
    questionInput.value = prefilledQuestion || this.lastUserQuestion || '';

    var self = this;

    cancelBtn.addEventListener('click', function () {
      card.remove();
      self.appendMessage('bot', 'No problem! Feel free to ask any other questions about Myco.');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (self.isSubmittingEscalation) return;

      // Validation
      var isValid = true;
      var nameVal = nameInput.value.trim();
      var emailVal = emailInput.value.trim();
      var questionVal = questionInput.value.trim();

      // Reset errors
      card.querySelectorAll('.myco-chat-form__input, .myco-chat-form__textarea').forEach(function (el) {
        el.classList.remove('is-invalid');
      });
      card.querySelectorAll('.myco-chat-form__error-text').forEach(function (el) {
        el.style.display = 'none';
        el.textContent = '';
      });

      if (!nameVal) {
        isValid = false;
        nameInput.classList.add('is-invalid');
        var errName = nameInput.parentElement.querySelector('.myco-chat-form__error-text');
        errName.textContent = 'Please provide your name.';
        errName.style.display = 'block';
      }

      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        isValid = false;
        emailInput.classList.add('is-invalid');
        var errEmail = emailInput.parentElement.querySelector('.myco-chat-form__error-text');
        errEmail.textContent = 'Please enter a valid work email address.';
        errEmail.style.display = 'block';
      }

      if (!questionVal) {
        isValid = false;
        questionInput.classList.add('is-invalid');
        var errQ = questionInput.parentElement.querySelector('.myco-chat-form__error-text');
        errQ.textContent = 'Please describe your question.';
        errQ.style.display = 'block';
      }

      if (!isValid) return;

      // Submission payload
      var payload = {
        name: nameVal,
        email: emailVal,
        question: questionVal,
        company: companyInput.value.trim(),
        phone: phoneInput.value.trim(),
        consent: consentInput.checked,
        conversationContext: self.messages.slice(-6).map(function (m) {
          return { sender: m.sender, text: m.text };
        }),
        pageUrl: window.location.href
      };

      self.submitEscalation(payload, card, submitBtn);
    });

    this.messagesContainer.appendChild(card);
    this.scrollToBottom();
  };

  ChatWidget.prototype.submitEscalation = function (payload, cardElement, submitBtn) {
    var self = this;
    this.isSubmittingEscalation = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Sending...</span>';

    var endpoint = config.escalationEndpoint || '/api/chat/escalations';

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function (res) {
        self.isSubmittingEscalation = false;
        if (res.ok && res.data && res.data.success) {
          // Success state
          cardElement.innerHTML = [
            '<div class="myco-chat-alert--success">',
            '  <strong>Inquiry Received!</strong>',
            '  <p style="margin:4px 0 0">' + (res.data.message || config.messages.leadSuccess) + '</p>',
            '</div>'
          ].join('');
          self.scrollToBottom();
        } else {
          // Error response from server
          var errMsg = (res.data && res.data.error) ? res.data.error : config.messages.leadError;
          self.showEscalationError(cardElement, submitBtn, errMsg);
        }
      })
      .catch(function (err) {
        self.isSubmittingEscalation = false;
        self.showEscalationError(cardElement, submitBtn, config.messages.leadError);
      });
  };

  ChatWidget.prototype.showEscalationError = function (cardElement, submitBtn, errorMsg) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Try Again</span>';

    var existingAlert = cardElement.querySelector('.myco-chat-alert--error');
    if (!existingAlert) {
      var alertDiv = document.createElement('div');
      alertDiv.className = 'myco-chat-alert--error';
      alertDiv.style.marginTop = '10px';
      alertDiv.textContent = errorMsg;
      cardElement.querySelector('form').appendChild(alertDiv);
    } else {
      existingAlert.textContent = errorMsg;
    }
    this.scrollToBottom();
  };

  // --------------------------------------------------------------------------
  // Auto-Initialization on DOMContentLoaded
  // --------------------------------------------------------------------------
  var initWidget = function () {
    if (!global.__mycoChatWidgetInstance) {
      global.__mycoChatWidgetInstance = new ChatWidget();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
  } else {
    global.MycoChatWidget = ChatWidget;
  }
})(typeof window !== 'undefined' ? window : this);
