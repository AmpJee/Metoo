const products = [
      { id:"oleo", name:"Oleo Revitalizing Serum", brand:"Zia", sku:"#ID-OLEO", stock:34245, category:"Health & Beauty", price:690, rating:5, visual:"visual-serum", icon:"🧴", description:"A nourishing daily serum with a silky finish, formulated for retailers looking for thoughtful self-care essentials." },
      { id:"morning", name:"Morning Brief Coffee", brand:"Lamune.", sku:"#ID-MORN", stock:18902, category:"Food & Beverage", price:690, rating:5, visual:"visual-coffee", icon:"☕", description:"A polished coffee ritual in a package that stands out on shelf and keeps customers coming back." },
      { id:"protein", name:"Protein Ball", brand:"EnerPhere", sku:"#ID-PROT", stock:27310, category:"Food & Beverage", price:690, rating:5, visual:"visual-protein", icon:"●", description:"An easy, protein-packed snack made for active shelves, point-of-sale displays, and repeat purchases." },
      { id:"mushroom", name:"Mushroom Chili Paste", brand:"Yajaa", sku:"#ID-MUSH", stock:15200, category:"Food & Beverage", price:690, rating:5, visual:"visual-chili", icon:"🍄", description:"A rich, savoury chili paste that gives everyday meals an exceptional, memorable finishing touch." },
      { id:"wallet", name:"Classic Wallet", brand:"Sentira", sku:"#ID-WALL", stock:9042, category:"Fashion & Accessories", price:690, rating:5, visual:"visual-wallet", icon:"▰", description:"A compact, considered essential with a timeless finish and a high-quality everyday feel." }
    ];

    let activeCategory = "all", searchQuery = "", cartQuantity = 0, selectedProduct = null, quantity = 0, toastTimer;
    const wishlist = new Set();
    const grid = document.getElementById("product-grid");
    const resultCount = document.getElementById("result-count");
    const emptyMessage = document.getElementById("empty-message");

    function showToast(message) {
      document.getElementById("toast-message").textContent = message;
      const toast = document.getElementById("toast");
      toast.classList.add("is-visible");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2800);
    }
    function updateCart(amount) {
      cartQuantity += amount;
      document.getElementById("cart-count").textContent = cartQuantity;
    }
    function heart(active) {
      return active ? '<i data-lucide="heart" width="16" height="16" fill="currentColor"></i>' : '<i data-lucide="heart" width="16" height="16"></i>';
    }
    function visibleProducts() {
      const query = searchQuery.toLowerCase();
      return products.filter(product => (activeCategory === "all" || product.category === activeCategory) && (!query || product.name.toLowerCase().includes(query) || product.brand.toLowerCase().includes(query)));
    }
    function renderProducts() {
      const visible = visibleProducts();
      grid.replaceChildren();
      resultCount.textContent = `${visible.length} ${visible.length === 1 ? "brand" : "brands"} to discover`;
      emptyMessage.hidden = visible.length > 0;
      visible.forEach(product => {
        const fragment = document.getElementById("product-card-template").content.cloneNode(true);
        const card = fragment.querySelector(".product-card");
        const visual = fragment.querySelector(".product-visual");
        const favourite = fragment.querySelector('[data-role="favorite"]');
        visual.classList.add(product.visual);
        fragment.querySelector('[data-role="icon"]').textContent = product.icon;
        fragment.querySelector('[data-role="category"]').textContent = product.category;
        fragment.querySelector('[data-role="price"]').textContent = `${product.price} THB`;
        fragment.querySelector('[data-role="name"]').textContent = product.name;
        fragment.querySelector('[data-role="brand"]').textContent = product.brand;
        fragment.querySelector('[data-role="rating"]').innerHTML = `★★★★★ <span>${product.rating}/5</span>`;
        favourite.innerHTML = heart(wishlist.has(product.id));
        favourite.setAttribute("aria-pressed", String(wishlist.has(product.id)));
        card.addEventListener("click", event => { if (!event.target.closest("button")) openProduct(product); });
        favourite.addEventListener("click", event => { event.stopPropagation(); toggleWishlist(product.id); });
        fragment.querySelector('[data-role="quick-add"]').addEventListener("click", event => { event.stopPropagation(); updateCart(1); showToast(`${product.name} added to your cart.`); });
        grid.appendChild(fragment);
      });
      lucide.createIcons();
    }
    function toggleWishlist(id) {
      wishlist.has(id) ? wishlist.delete(id) : wishlist.add(id);
      showToast(wishlist.has(id) ? "Saved to your wishlist." : "Removed from your saved brands.");
      renderProducts();
      if (selectedProduct && selectedProduct.id === id) updateDetailWish();
    }
    function openProduct(product) {
      selectedProduct = product; quantity = 0;
      document.getElementById("home-view").hidden = true;
      document.getElementById("detail-view").hidden = false;
      const visual = document.getElementById("detail-visual");
      visual.className = `detail-visual ${product.visual}`;
      visual.textContent = product.icon;
      document.getElementById("detail-name").textContent = product.name;
      document.getElementById("detail-meta").textContent = `${product.sku} · ${product.stock.toLocaleString()} in stock`;
      document.getElementById("detail-rating").textContent = `★★★★★  ${product.rating}/5`;
      document.getElementById("detail-price").textContent = `${product.price} THB`;
      document.getElementById("detail-brand").textContent = product.brand;
      document.getElementById("detail-description").textContent = product.description;
      updateQuantity(); updateDetailWish(); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function updateDetailWish() {
      const button = document.getElementById("detail-wish");
      const active = selectedProduct && wishlist.has(selectedProduct.id);
      button.innerHTML = heart(active); button.setAttribute("aria-pressed", String(active)); lucide.createIcons();
    }
    function updateQuantity() {
      document.getElementById("quantity-value").textContent = quantity;
      document.querySelectorAll(".preset-button").forEach(button => button.classList.toggle("is-active", Number(button.dataset.quantity) === quantity));
    }

    document.getElementById("product-search").addEventListener("input", event => { searchQuery = event.target.value.trim(); renderProducts(); });
    document.querySelectorAll(".category-button").forEach(button => button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      document.querySelectorAll(".category-button").forEach(item => item.classList.toggle("is-active", item === button));
      renderProducts();
    }));
    document.getElementById("back-button").addEventListener("click", () => { document.getElementById("detail-view").hidden = true; document.getElementById("home-view").hidden = false; window.scrollTo({top:0,behavior:"smooth"}); });
    document.getElementById("detail-wish").addEventListener("click", () => { if (selectedProduct) toggleWishlist(selectedProduct.id); });
    document.querySelectorAll(".preset-button").forEach(button => button.addEventListener("click", () => { quantity = Number(button.dataset.quantity); updateQuantity(); }));
    document.getElementById("quantity-minus").addEventListener("click", () => { quantity = Math.max(0, quantity - 1); updateQuantity(); });
    document.getElementById("quantity-plus").addEventListener("click", () => { quantity += 1; updateQuantity(); });
    document.getElementById("add-cart-button").addEventListener("click", () => {
      if (!selectedProduct || !quantity) return showToast("Choose an amount before adding to cart.");
      updateCart(quantity); showToast(`${quantity} × ${selectedProduct.name} added to your cart.`);
    });
    document.getElementById("chat-button").addEventListener("click", () => showToast("Your message window is ready — the seller will be in touch."));
    document.getElementById("header-cart-button").addEventListener("click", () => showToast(cartQuantity ? `You have ${cartQuantity} item${cartQuantity === 1 ? "" : "s"} in your cart.` : "Your cart is ready for something special."));
    document.getElementById("header-message-button").addEventListener("click", () => showToast("No new messages — start a conversation with a seller."));
    document.getElementById("account-button").addEventListener("click", () => showToast("Your marketplace profile is ready to personalise."));
    ["hero-sell-button","hero-login-button","story-buy-button","story-sell-button"].forEach(id => document.getElementById(id).addEventListener("click", () => showToast("This marketplace demo is ready for your next step.")));
    document.querySelectorAll(".social-button").forEach(button => button.addEventListener("click", () => showToast("Follow metoo. for fresh independent finds.")));
    renderProducts(); lucide.createIcons();
    
    document.getElementById("hero-sell-button").addEventListener("click", () => window.location.href = "Signup.html?role=seller");
    document.getElementById("hero-login-button").addEventListener("click", () => window.location.href = "login.html");
    document.getElementById("story-buy-button").addEventListener("click", () => window.location.href = "Signup.html?role=buyer");
    document.getElementById("story-sell-button").addEventListener("click", () => window.location.href = "Signup.html?role=seller");
