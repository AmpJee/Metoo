
    const params = new URLSearchParams(location.search);
    const from = params.get('from') === 'retailer' ? 'retailer' : 'seller';
    const backLink = document.getElementById('notification-back');
    const notificationTitle = document.getElementById('notification-title');
    const notificationSubtitle = document.getElementById('notification-subtitle');
    const notificationList = document.getElementById('notification-list');

    const sellerItems = [
      { title: 'New buyer request', meta: '5 min ago', copy: 'A buyer asked for wholesale pricing for your seasonal gift collection.', pill: 'New', target: 'Chat.html?from=seller' },
      { title: 'Chat from retailer', meta: '1 hour ago', copy: 'Retailer Support replied to your product question and shared lead times.', pill: 'Message', target: 'Chat.html?from=seller' },
      { title: 'Inventory reminder', meta: 'Today', copy: 'Your top-selling item is running low. Update stock before tomorrow’s order window.', pill: 'Reminder', target: 'Seller.html' }
    ];

    const retailerItems = [
      { title: 'New order received', meta: '12 min ago', copy: 'A retailer placed a fresh order for your premium wellness line.', pill: 'Order', target: 'Retailer.html' },
      { title: 'Marketplace visibility', meta: '2 hours ago', copy: 'Your latest product is now featured in the discovery feed for buyers.', pill: 'Update', target: 'Seller.html' },
      { title: 'Payout ready', meta: 'Today', copy: 'Your latest payout has been prepared and is awaiting confirmation.', pill: 'Finance', target: 'Chat.html?from=retailer' }
    ];

    const items = from === 'retailer' ? retailerItems : sellerItems;

    if (backLink) {
      backLink.href = from === 'retailer' ? 'Retailer.html' : 'Seller.html';
      backLink.querySelector('.back-text').textContent = from === 'retailer' ? 'Back to retailer page' : 'Back to seller page';
    }

    if (notificationTitle) {
      notificationTitle.textContent = from === 'retailer' ? 'Retailer notifications' : 'Seller notifications';
    }

    if (notificationSubtitle) {
      notificationSubtitle.textContent = from === 'retailer'
        ? 'Updates about your storefront, orders, and customer activity.'
        : 'Updates about your catalog, chats, and new buyers.';
    }

    if (notificationList) {
      notificationList.innerHTML = items.map(item => `
        <a class="notification-card" href="${item.target}">
          <span class="unread-dot" aria-hidden="true"></span>
          <div class="notification-top">
            <div class="notification-icon">
              <i data-lucide="bell" width="18" height="18"></i>
            </div>
            <div>
              <h2 class="notification-title">${item.title}</h2>
              <p class="notification-meta">${item.meta}</p>
            </div>
          </div>
          <p class="notification-copy">${item.copy}</p>
          <span class="notification-pill">${item.pill}</span>
        </a>
      `).join('');
    }

    if (window.lucide) lucide.createIcons();
