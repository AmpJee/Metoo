const chatData = {
  'Retailer Support': {
    request: 'Hi, I’d like to request pricing and lead time for your latest product range.',
    messages: [
      { type: 'incoming', author: 'Retailer Support', time: '09:25', text: 'Hi! Thanks for reaching out. Tell me what product you are interested in and I’ll share the details.' },
      { type: 'outgoing', author: 'You', time: '09:27', text: 'I’m interested in the seasonal gift collection and need minimum order quantities.' },
      { type: 'incoming', author: 'Retailer Support', time: '09:28', text: 'Great! I’ll send you the pricing, MOQ and available delivery dates now.' }
    ]
  },
  'Anne from Brand': {
    request: 'Please send me wholesale pricing for the new accessories range.',
    messages: [
      { type: 'incoming', author: 'Anne from Brand', time: '10:02', text: 'Hello! Which accessory collection are you looking at?' }
    ]
  },
  'James': {
    request: 'Need a quick quote for bulk order delivery.',
    messages: [
      { type: 'incoming', author: 'James', time: '08:45', text: 'Hey! I can share the quote once I know your order quantity.' }
    ]
  }
};

const personButtons = document.querySelectorAll('.person-card');
const messagesContainer = document.querySelector('.chat-messages');
const chatTitle = document.querySelector('.chat-room-header h2');
const requestCopy = document.querySelector('.request-copy');
const chatForm = document.querySelector('.chat-input');
const chatInput = chatForm.querySelector('input');
const reportButton = document.querySelector('.report-button');
const previewBox = document.getElementById('chat-preview');
const chatRoom = document.querySelector('.chat-room');

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessages(thread) {
  messagesContainer.innerHTML = '';
  thread.messages.forEach(message => {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${message.type}`;
    messageEl.innerHTML = `
      <p class="message-meta">${message.author} • ${message.time}</p>
      <p>${message.text}</p>
    `;
    messagesContainer.appendChild(messageEl);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  chatRoom.classList.add('active');
}

function updateChatFor(name) {
  const thread = chatData[name];
  if (!thread) return;
  chatTitle.textContent = name;
  requestCopy.textContent = thread.request;
  renderMessages(thread);
}

function setActivePerson(button) {
  personButtons.forEach(btn => btn.classList.toggle('is-active', btn === button));
}

function showPreview(button) {
  const previewText = button.dataset.preview || 'Hover a person to preview their latest chat.';
  previewBox.querySelector('.preview-text').textContent = previewText;
  previewBox.classList.add('visible');
}

function hidePreview() {
  previewBox.classList.remove('visible');
}

personButtons.forEach(button => {
  button.addEventListener('mouseenter', () => showPreview(button));
  button.addEventListener('mouseleave', hidePreview);

  button.addEventListener('click', () => {
    setActivePerson(button);
    const name = button.dataset.person || button.textContent.trim();
    updateChatFor(name);
  });
});

chatForm.addEventListener('submit', event => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  const activeButton = document.querySelector('.person-card.is-active');
  if (!activeButton) return;

  const name = activeButton.dataset.person || activeButton.textContent.trim();
  const thread = chatData[name];
  const time = formatTime();

  const outgoing = { type: 'outgoing', author: 'You', time, text };
  thread.messages.push(outgoing);
  renderMessages(thread);
  chatInput.value = '';
  chatInput.focus();

  setTimeout(() => {
    const reply = {
      type: 'incoming',
      author: name,
      time: formatTime(),
      text: 'Thanks! I received your request and will reply with details shortly.'
    };
    thread.messages.push(reply);
    renderMessages(thread);
  }, 900);
});

reportButton.addEventListener('click', () => {
  window.alert('Report chat: this conversation will be reviewed by support.');
});

window.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  const defaultPerson = document.querySelector('.person-card.is-active') || personButtons[0];
  const requestAction = document.querySelector('.request-action');
  const mobileBack = document.querySelector('.chat-mobile-back');
  const sidebar = document.querySelector('.chat-sidebar');
  const chatRoom = document.querySelector('.chat-room');
  const isMobile = window.matchMedia('(max-width: 720px)').matches;

  if (defaultPerson) {
    setActivePerson(defaultPerson);
    if (!isMobile) {
      updateChatFor(defaultPerson.dataset.person || defaultPerson.textContent.trim());
    }
  }

  function openChat() {
    document.body.classList.add('mobile-chat-open');
    chatRoom.scrollIntoView({ behavior: 'smooth' });
  }

  function closeChat() {
    document.body.classList.remove('mobile-chat-open');
    sidebar.scrollIntoView({ behavior: 'smooth' });
  }

  personButtons.forEach(button => {
    button.addEventListener('click', () => {
      const name = button.dataset.person || button.textContent.trim();
      setActivePerson(button);
      updateChatFor(name);
      if (isMobile) {
        openChat();
      }
    });
  });

  if (requestAction) {
    requestAction.addEventListener('click', () => {
      if (defaultPerson) {
        const name = defaultPerson.dataset.person || defaultPerson.textContent.trim();
        setActivePerson(defaultPerson);
        updateChatFor(name);
        if (isMobile) {
          openChat();
        }
      }
    });
  }

  if (mobileBack) {
    mobileBack.addEventListener('click', () => {
      closeChat();
    });
  }
});