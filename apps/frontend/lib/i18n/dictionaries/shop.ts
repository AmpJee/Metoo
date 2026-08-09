/**
 * The buyer's site: explore, product, cart, checkout, orders, saved, stores,
 * returns and settings.
 *
 * Enum labels (categories, order statuses) are not here — they live in
 * `enums.ts`, keyed off the shared enums so a new value cannot be added
 * without a translation.
 */

export const en = {
  // --- explore -------------------------------------------------------------
  'explore.title': 'Explore',
  'explore.all': 'All',
  'explore.results': 'Results for “{q}”',
  'explore.brandResults': 'Brands',
  'explore.productResults': 'Products',
  'explore.noPhoto': 'No photo',
  'explore.perPack': '/pack',
  'explore.emptyTitle': 'No products found.',
  'explore.emptySearch': 'Try a different search term, or browse a category.',
  'explore.emptyCategory': 'Nothing is listed in this category yet.',
  'explore.browseEverything': 'Browse everything',
  'explore.loadMore': 'Load more',

  // --- product card, shared by explore, storefront and saved ---------------
  'card.noLongerSold': 'No longer sold',
  'card.outOfStock': 'Out of stock',
  // Units and minimum order, rendered together beneath a price.
  'card.unitsPerPack': '{n} units/pack',
  'card.unitPerPack': '{n} unit/pack',
  'card.minPacks': 'min {n} packs',

  // --- product detail ------------------------------------------------------
  'product.title': 'Product',
  'product.perPack': 'per pack',
  'product.stock': 'Stock',
  'product.madeToOrder': 'Made to order',
  'product.stockPacks': '{n} packs',
  'product.reviewCount': '({n} reviews)',
  'product.noReviews': 'No reviews yet',
  'product.description': 'Description',
  'product.reviews': 'Reviews ({n})',
  'product.amount': 'Amount',
  'product.unitBreakdown': '{n} × {price}',
  'product.saves': 'saves {amount}',
  'product.addToCart': 'Add to Cart',
  'product.unavailable': 'Unavailable',
  'product.minimumOrder': 'Minimum order {n} packs.',
  'product.addedToCart': 'Added to your cart.',
  'product.packs': '{n} packs',
  'product.pack': '{n} pack',
  'product.decreaseQuantity': 'Decrease quantity',
  'product.increaseQuantity': 'Increase quantity',

  // --- cart ----------------------------------------------------------------
  'cart.title': 'Shopping Cart',
  'cart.emptyTitle': 'Your cart is empty',
  'cart.emptyBody': 'Browse the marketplace and add items to your cart.',
  'cart.startShopping': 'Start shopping',
  'cart.summary': 'Order summary',
  'cart.subtotalItems': 'Subtotal ({n} items)',
  'cart.subtotalItem': 'Subtotal ({n} item)',
  'cart.shipping': 'Shipping',
  'delivery.title': 'Delivery address',
  'delivery.subtitle':
    'Where parcels are sent. Separate from your shop address — leave it blank ' +
    'and we deliver to the shop.',
  'delivery.usingShopAddress':
    'No delivery address yet, so orders go to your shop address.',
  'delivery.recipient': 'Recipient name',
  'delivery.recipientPlaceholder': 'Who signs for the parcel',
  'delivery.phone': 'Phone number',
  'delivery.addressLine': 'House no., soi, moo, road',
  'delivery.addressLinePlaceholder': 'e.g. 112, room 705, Soi Vibhavadi 2',
  'delivery.subdistrict': 'Sub-district',
  'delivery.district': 'District',
  'delivery.province': 'Province',
  'delivery.chooseProvince': 'Choose a province',
  'delivery.postalCode': 'Postal code',
  'cart.shippingFree': 'Free',
  'cart.firstOrderFreeShipping':
    'Welcome — delivery is on us for your first order.',
  'product.shippingEstimate': 'Delivery about {amount} for this quantity',
  'product.shippingFree': 'Free delivery',
  'product.shippingToFree':
    'Add {amount} more from this brand for free delivery',
  'cart.toFreeShipping':
    'Add {amount} more from {brand} for free delivery on their parcel.',
  'cart.total': 'Total',
  'cart.splitNotice':
    'Your cart spans {n} brands, so it will be placed as {n} separate orders — one per brand, each tracked and delivered on its own.',
  'cart.profileNeeded':
    'Before your first order we need a few details about your shop so we can arrange delivery: {fields}.',
  'cart.completeProfile': 'Complete your shop profile',
  'cart.checkout': 'Check Out',
  'cart.continue': 'Continue shopping',
  'cart.remove': 'Remove',
  'cart.perPack': '/ pack',
  'cart.retired': 'No longer available — remove to check out',

  // --- checkout ------------------------------------------------------------
  'checkout.title': 'Checkout',
  'checkout.emptyBody': 'Add something to your cart before checking out.',
  'checkout.deliveryAddress': 'Delivery Address',
  'checkout.addressNote':
    'Delivered to the address registered to your shop. To change it, contact support.',
  'checkout.productsOrdered': 'Products Ordered',
  'checkout.subtotal': 'Subtotal',
  'checkout.totalPayment': 'Total Payment',
  'checkout.merchandiseSubtotal': 'Merchandise subtotal',
  'checkout.shippingSubtotal': 'Shipping subtotal',

  'checkout.orderTotal': 'Order Total',
  'checkout.splitNotice':
    'This becomes {n} orders, one per brand. Each is confirmed and delivered separately, so a delay at one brand never holds up another.',
  'checkout.backToCart': 'Back to cart',
  'checkout.paymentMethod': 'Payment Method',
  'checkout.promptpay': 'QR PromptPay',
  'checkout.promptpayHint': 'Scan and transfer once the order is placed',
  'checkout.card': 'Credit / Debit Card',
  'checkout.cardHint': 'Coming soon',
  'checkout.noPaymentNow':
    'No payment is taken now. This total, delivery included, is what you transfer once the order is placed — scan the PromptPay QR, send us the slip, and the brand accepts your order once we confirm it.',
  'checkout.placeOrder': 'Place Order',
  'checkout.placeOrderSplit': 'Place Order ({n} orders)',

  // --- orders list ---------------------------------------------------------
  'orders.title': 'My Purchase',
  'orders.tab.all': 'All',
  'orders.tab.toPay': 'To Pay',
  'orders.tab.toShip': 'To Ship',
  'orders.tab.toReceive': 'To Receive',
  'orders.tab.completed': 'Completed',
  'orders.tab.cancelled': 'Cancelled',
  'orders.tab.returns': 'Return Refund',
  'orders.emptyTitle': 'No orders here yet',
  'orders.emptyBody': 'Orders with this status will appear here.',
  'orders.startShopping': 'Start shopping',
  'orders.orderTotal': 'Order Total',
  'orders.pay': 'Pay',
  'orders.more': '+{n} more',
  'orders.open': 'Open order',

  // --- order detail --------------------------------------------------------
  'order.title': 'Order {number}',
  'order.fallbackTitle': 'Order',
  'order.placed': 'Placed {date}',
  'order.track': 'Track',
  'order.productsOrdered': 'Products Ordered',
  'order.lineDetail': '{price} × {packs} packs',
  'order.priceNote': 'Prices shown are those at the time the order was placed.',
  'order.subtotal': 'Subtotal',
  'order.shipping': 'Shipping',
  'order.total': 'Total',
  'order.deliveryAddress': 'Delivery Address',
  'order.requestReturn': 'Request a return',
  'order.viewGroup': 'View all orders from this checkout',
  'order.rateTitle': 'Rate what you bought',
  'order.rateSubtitle': 'Your rating is public and helps other shops decide.',
  'order.cancelled': 'This order is cancelled.',
  'order.closed': 'This order is closed.',

  // --- confirm delivered ---------------------------------------------------
  'order.confirmDelivered': 'Confirm Delivered',
  'order.confirmDeliveredHint':
    'Confirms you received the goods and releases payment to the brand.',
  'order.confirmDeliveredAsk':
    'Confirm you received this order? This completes it and releases payment to the brand. It cannot be undone.',

  // --- checkout group / confirmation ---------------------------------------
  'group.title': 'Order placed',
  'group.heading': 'Orders from this checkout',
  'group.placed': 'Order placed! Thank you for shopping with metoo.',
  'group.oneBrand':
    'Once we confirm your payment, the brand will accept your order.',
  'group.manyBrands':
    'Your cart spanned {n} brands, so it was placed as {n} separate orders. Each is confirmed and delivered on its own.',
  'group.noPaymentYet':
    'No payment has been taken yet. Transfer the amount, send us the slip, and the brand accepts your order once we confirm it.',
  'group.countOne': '{n} order total',
  'group.countMany': '{n} orders total',
  'group.goToOrders': 'Go to My Purchase',

  // --- pay by PromptPay ----------------------------------------------------
  'pay.title': 'Pay',
  'pay.heading': 'Pay {number}',
  'pay.backToOrder': 'Back to order',
  'pay.qrAlt': 'PromptPay QR code',
  'pay.noQr':
    'The PromptPay QR has not been set up yet. Contact support to arrange payment.',
  'pay.amount': 'Amount',
  'pay.reference': 'Reference',
  'pay.referenceHint':
    'Put the order number in the transfer note — it is how we match your payment to this order.',
  'pay.stillToPay':
    'The order stays in "{status}" until we confirm your transfer arrived. The brand accepts it after that.',
  'slip.title': 'Send your transfer slip',
  'slip.hint':
    'A photo or PDF of the transfer. We check it, then the brand starts preparing your order.',
  'slip.upload': 'Upload slip',
  'slip.replace': 'Upload a different slip',
  'slip.sent': 'Slip received {when} — we will check it shortly.',
  'slip.badType': 'Send a JPG, PNG, WebP or PDF.',
  'slip.tooLarge': 'That file is over 10 MB. Try a smaller photo.',
  'slip.failed': 'The upload did not finish. Please try again.',

  // --- saved ---------------------------------------------------------------
  'saved.title': 'Saved',
  'saved.tab.favourites': 'Favorite',
  'saved.tab.later': 'Saved for Later',
  'saved.emptyFavourites': 'No favorites yet',
  'saved.emptyFavouritesBody': 'Tap the heart on a product to keep it here.',
  'saved.emptyLater': 'Nothing saved for later',
  'saved.emptyLaterBody': 'Save products you are not ready to order yet.',
  'saved.addFavourite': 'Add to favorites',
  'saved.removeFavourite': 'Remove from favorites',
  'saved.addLater': 'Add to saved for later',
  'saved.removeLater': 'Remove from saved for later',

  // --- stores --------------------------------------------------------------
  'stores.title': 'Stores',
  'stores.following': 'Brands you follow',
  'stores.all': 'All brands',
  'stores.emptyTitle': 'No brands yet',
  'stores.emptyBody': 'Brands appear here once they list their first product.',
  'stores.isFollowing': 'Following',
  'stores.follow': 'Follow',
  'stores.followerOne': '{n} follower',
  'stores.followerMany': '{n} followers',
  'store.fallbackTitle': 'Store',
  'store.productCount': '{n} products',
  'store.memberSince': 'Member since {date}',
  'store.noProducts': 'No products listed',
  'store.noProductsBody': 'This brand has not published any products yet.',

  // --- returns -------------------------------------------------------------
  'returns.title': 'Return Refund',
  'returns.subtitle': 'Returns can be raised once an order has been delivered.',
  'returns.emptyTitle': 'No return requests',
  'returns.emptyBody':
    'Once an order is delivered, you can raise a return from the order page.',
  'returns.REQUESTED': 'Under review',
  'returns.ACCEPTED': 'Refund issued',
  'returns.REJECTED': 'Declined',
  'returns.reason': 'Reason',
  'returns.response': 'Response',
  'returns.refunded':
    'Refund of the item total has been issued to your wallet.',
  'returns.raised': 'Raised {date}',
  'returns.orderTotal': 'Order total {amount}',

  // --- raise a return ------------------------------------------------------
  'returnNew.title': 'Request a return',
  'returnNew.delivered': 'Delivered {date} · {amount}',
  'returnNew.deliveredRecently': 'recently',
  'returnNew.explainer':
    'The brand reviews your request. If it is accepted, the item total is refunded to your wallet and the order is closed.',
  'returnNew.prompt': 'What is wrong with the order?',
  'returnNew.placeholder':
    'Describe the problem — damaged items, wrong products, short delivery…',
  'returnNew.submit': 'Submit',

  // --- account settings ----------------------------------------------------
  'settings.title': 'Account settings',
  'settings.subtitle': 'Your shop details and sign-in.',
  'settings.picture': 'Shop picture',
  'settings.details': 'Shop details',
  'settings.shopName': 'Shop name',
  'settings.phone': 'Phone',
  'settings.address': 'Address',
  'settings.addressHint':
    'Where future orders are delivered. Orders already placed keep the address you gave at checkout.',
  'settings.province': 'Province',
  'settings.postalCode': 'Postal code',
  'settings.taxId': 'Tax ID',
  'settings.saveFailed': 'Could not save your profile.',

  // --- how your shop operates ----------------------------------------------
  'shopOps.title': 'How your shop operates',
  'shopOps.subtitle':
    'Metoo needs these to arrange delivery. They must be filled in before you can place an order.',
  'shopOps.stillNeeded':
    'Complete these before you can place an order. Still needed: {fields}.',
  'shopOps.chooseOne': 'Choose one',
  'shopOps.shopType': 'Shop type',
  'shopOps.zone': 'Location or zone',
  'shopOps.zonePlaceholder': 'e.g. Sukhumvit, Soi 31 area',
  'shopOps.currentProducts': 'What you currently stock',
  'shopOps.currentProductsPlaceholder': 'Snacks, drinks, household goods…',
  'shopOps.capacity': 'Monthly capacity (orders you can take)',
  'shopOps.capacityPlaceholder': 'e.g. 40',
  'shopOps.preferredPayment': 'Preferred payment',
  'shopOps.deliveryWindow': 'Delivery window',
  'shopOps.deliveryWindowPlaceholder': 'e.g. Weekday mornings, 9am–12pm',
  'shopOps.save': 'Save shop details',

  // --- picture upload ------------------------------------------------------
  'picture.change': 'Change picture',
  'picture.upload': 'Upload picture',
  'picture.limits': 'JPEG, PNG or WebP, up to 5 MB.',
  'picture.badType': 'Use a JPEG, PNG or WebP image.',
  'picture.tooLarge': 'That image is larger than 5 MB.',
  'picture.failed': 'The upload did not complete. Try again.',

  // --- change password -----------------------------------------------------
  'password.title': 'Password',
  'password.subtitle': 'Changing it signs you out on every other device.',
  'password.current': 'Current password',
  'password.new': 'New password',
  'password.confirm': 'Confirm new password',
  'password.minimum': 'At least {n} characters.',
  'password.mismatch': 'The two new passwords do not match.',
  'password.tooShort': 'Use at least {n} characters.',
  'password.unchanged': 'That is the password you already have.',
  'password.failed': 'Could not change your password.',
  'password.changed':
    'Password changed. Any other device signed in as you has been signed out.',
  'password.submit': 'Change password',

  // --- reviewing a product you bought --------------------------------------
  'review.edit': 'Edit',
  'review.write': 'Write a review',
  'review.submit': 'Submit review',
  'review.update': 'Update review',
  'review.placeholder': 'How was it? (optional)',
  'review.pickStars': 'Pick a star rating first.',
  'review.ratingGroup': 'Rating out of 5',
  'review.stars': '{n} stars',
  'review.outOf': '{n} out of 5',
} as const

export type Dict = typeof en

export const th: Record<keyof Dict, string> = {
  // --- explore -------------------------------------------------------------
  'explore.title': 'สำรวจสินค้า',
  'explore.all': 'ทั้งหมด',
  'explore.results': 'ผลการค้นหา “{q}”',
  'explore.brandResults': 'แบรนด์',
  'explore.productResults': 'สินค้า',
  'explore.noPhoto': 'ไม่มีรูปภาพ',
  'explore.perPack': '/แพ็ก',
  'explore.emptyTitle': 'ไม่พบสินค้า',
  'explore.emptySearch': 'ลองค้นหาด้วยคำอื่น หรือเลือกดูตามหมวดหมู่',
  'explore.emptyCategory': 'ยังไม่มีสินค้าในหมวดหมู่นี้',
  'explore.browseEverything': 'ดูสินค้าทั้งหมด',
  'explore.loadMore': 'ดูเพิ่มเติม',

  // --- product card --------------------------------------------------------
  'card.noLongerSold': 'เลิกจำหน่ายแล้ว',
  'card.outOfStock': 'สินค้าหมด',
  // Thai has no plural inflection, so both forms are the same string. They
  // stay as two keys because the English side does distinguish them.
  'card.unitsPerPack': '{n} ชิ้น/แพ็ก',
  'card.unitPerPack': '{n} ชิ้น/แพ็ก',
  'card.minPacks': 'ขั้นต่ำ {n} แพ็ก',

  // --- product detail ------------------------------------------------------
  'product.title': 'สินค้า',
  'product.perPack': 'ต่อแพ็ก',
  'product.stock': 'สต็อก',
  'product.madeToOrder': 'ผลิตตามสั่ง',
  'product.stockPacks': '{n} แพ็ก',
  'product.reviewCount': '({n} รีวิว)',
  'product.noReviews': 'ยังไม่มีรีวิว',
  'product.description': 'รายละเอียดสินค้า',
  'product.reviews': 'รีวิว ({n})',
  'product.amount': 'จำนวน',
  'product.unitBreakdown': '{n} × {price}',
  'product.saves': 'ประหยัด {amount}',
  'product.addToCart': 'เพิ่มลงตะกร้า',
  'product.unavailable': 'ไม่พร้อมจำหน่าย',
  'product.minimumOrder': 'สั่งซื้อขั้นต่ำ {n} แพ็ก',
  'product.addedToCart': 'เพิ่มลงตะกร้าแล้ว',
  'product.packs': '{n} แพ็ก',
  'product.pack': '{n} แพ็ก',
  'product.decreaseQuantity': 'ลดจำนวน',
  'product.increaseQuantity': 'เพิ่มจำนวน',

  // --- cart ----------------------------------------------------------------
  'cart.title': 'ตะกร้าสินค้า',
  'cart.emptyTitle': 'ยังไม่มีสินค้าในตะกร้า',
  'cart.emptyBody': 'เลือกดูสินค้าแล้วเพิ่มลงตะกร้าได้เลย',
  'cart.startShopping': 'เริ่มเลือกซื้อ',
  'cart.summary': 'สรุปคำสั่งซื้อ',
  'cart.subtotalItems': 'ยอดรวมสินค้า ({n} รายการ)',
  'cart.subtotalItem': 'ยอดรวมสินค้า ({n} รายการ)',
  'cart.shipping': 'ค่าจัดส่ง',
  'delivery.title': 'ที่อยู่ในการจัดส่ง',
  'delivery.subtitle':
    'ที่อยู่สำหรับส่งพัสดุ แยกจากที่อยู่ร้านค้า หากเว้นว่างไว้ เราจะจัดส่งไปที่ร้านของคุณ',
  'delivery.usingShopAddress':
    'ยังไม่ได้ตั้งที่อยู่จัดส่ง ระบบจะส่งพัสดุไปที่อยู่ร้านค้าของคุณ',
  'delivery.recipient': 'ชื่อ นามสกุล ผู้รับ',
  'delivery.recipientPlaceholder': 'ผู้ที่รับพัสดุแทนได้',
  'delivery.phone': 'หมายเลขโทรศัพท์',
  'delivery.addressLine': 'บ้านเลขที่, ซอย, หมู่, ถนน',
  'delivery.addressLinePlaceholder': 'เช่น 112 ห้อง 705 ซอย วิภาวดีรังสิต 2',
  'delivery.subdistrict': 'แขวง/ตำบล',
  'delivery.district': 'เขต/อำเภอ',
  'delivery.province': 'จังหวัด',
  'delivery.chooseProvince': 'เลือกจังหวัด',
  'delivery.postalCode': 'รหัสไปรษณีย์',
  'cart.shippingFree': 'ฟรี',
  'cart.firstOrderFreeShipping': 'ยินดีต้อนรับ — คำสั่งซื้อแรกของคุณ ส่งฟรี',
  'product.shippingEstimate': 'ค่าจัดส่งประมาณ {amount} สำหรับจำนวนนี้',
  'product.shippingFree': 'ส่งฟรี',
  'product.shippingToFree': 'สั่งจากแบรนด์นี้เพิ่มอีก {amount} ส่งฟรี',
  'cart.toFreeShipping':
    'สั่งจาก {brand} เพิ่มอีก {amount} ส่งฟรีสำหรับพัสดุนี้',
  'cart.total': 'ยอดรวมทั้งหมด',
  'cart.splitNotice':
    'ตะกร้าของคุณมีสินค้าจาก {n} แบรนด์ ระบบจะแยกเป็น {n} คำสั่งซื้อ แบรนด์ละ 1 รายการ ติดตามและจัดส่งแยกกัน',
  'cart.profileNeeded':
    'ก่อนสั่งซื้อครั้งแรก เราต้องการข้อมูลร้านของคุณเพื่อจัดส่ง: {fields}',
  'cart.completeProfile': 'กรอกข้อมูลร้านให้ครบ',
  'cart.checkout': 'สั่งซื้อ',
  'cart.continue': 'เลือกซื้อสินค้าต่อ',
  'cart.remove': 'ลบ',
  'cart.perPack': '/ แพ็ก',
  'cart.retired': 'สินค้าไม่พร้อมจำหน่ายแล้ว — ลบออกเพื่อสั่งซื้อ',

  // --- checkout ------------------------------------------------------------
  'checkout.title': 'ยืนยันการสั่งซื้อ',
  'checkout.emptyBody': 'เพิ่มสินค้าลงตะกร้าก่อนสั่งซื้อ',
  'checkout.deliveryAddress': 'ที่อยู่จัดส่ง',
  'checkout.addressNote':
    'จัดส่งไปยังที่อยู่ที่ลงทะเบียนไว้กับร้านของคุณ หากต้องการเปลี่ยน กรุณาติดต่อทีมงาน',
  'checkout.productsOrdered': 'รายการสินค้า',
  'checkout.subtotal': 'ยอดรวม',
  'checkout.totalPayment': 'ยอดชำระทั้งหมด',
  'checkout.merchandiseSubtotal': 'ยอดรวมค่าสินค้า',
  'checkout.shippingSubtotal': 'ยอดรวมค่าจัดส่ง',

  'checkout.orderTotal': 'ยอดรวมคำสั่งซื้อ',
  'checkout.splitNotice':
    'รายการนี้จะแยกเป็น {n} คำสั่งซื้อ แบรนด์ละ 1 รายการ แต่ละรายการยืนยันและจัดส่งแยกกัน ความล่าช้าของแบรนด์หนึ่งจึงไม่กระทบอีกแบรนด์',
  'checkout.backToCart': 'กลับไปที่ตะกร้า',
  'checkout.paymentMethod': 'วิธีชำระเงิน',
  'checkout.promptpay': 'PromptPay QR',
  'checkout.promptpayHint': 'สแกนและโอนเงินหลังสั่งซื้อ',
  'checkout.card': 'บัตรเครดิต / เดบิต',
  'checkout.cardHint': 'เร็ว ๆ นี้',
  'checkout.noPaymentNow':
    'ยังไม่มีการเรียกเก็บเงินตอนนี้ ยอดรวมนี้รวมค่าจัดส่งแล้ว และเป็นยอดที่คุณจะโอนหลังสั่งซื้อ สแกน PromptPay QR แล้วส่งสลิปให้เรา เมื่อเรายืนยันแล้ว แบรนด์จะรับออร์เดอร์ของคุณ',
  'checkout.placeOrder': 'ยืนยันสั่งซื้อ',
  'checkout.placeOrderSplit': 'ยืนยันสั่งซื้อ ({n} คำสั่งซื้อ)',

  // --- orders list ---------------------------------------------------------
  'orders.title': 'คำสั่งซื้อของฉัน',
  'orders.tab.all': 'ทั้งหมด',
  'orders.tab.toPay': 'รอชำระเงิน',
  'orders.tab.toShip': 'รอจัดส่ง',
  'orders.tab.toReceive': 'รอรับสินค้า',
  'orders.tab.completed': 'สำเร็จ',
  'orders.tab.cancelled': 'ยกเลิก',
  'orders.tab.returns': 'คืนสินค้า/คืนเงิน',
  'orders.emptyTitle': 'ยังไม่มีคำสั่งซื้อในหมวดนี้',
  'orders.emptyBody': 'คำสั่งซื้อที่มีสถานะนี้จะแสดงที่นี่',
  'orders.startShopping': 'เริ่มเลือกซื้อ',
  'orders.orderTotal': 'ยอดรวม',
  'orders.pay': 'ชำระเงิน',
  'orders.more': 'และอีก {n} รายการ',
  'orders.open': 'เปิดดูคำสั่งซื้อ',

  // --- order detail --------------------------------------------------------
  'order.title': 'คำสั่งซื้อ {number}',
  'order.fallbackTitle': 'คำสั่งซื้อ',
  'order.placed': 'สั่งซื้อเมื่อ {date}',
  'order.track': 'ติดตามสถานะ',
  'order.productsOrdered': 'รายการสินค้า',
  'order.lineDetail': '{price} × {packs} แพ็ก',
  'order.priceNote': 'ราคาที่แสดงคือราคา ณ เวลาที่สั่งซื้อ',
  'order.subtotal': 'ยอดรวมสินค้า',
  'order.shipping': 'ค่าจัดส่ง',
  'order.total': 'ยอดรวมทั้งหมด',
  'order.deliveryAddress': 'ที่อยู่จัดส่ง',
  'order.requestReturn': 'ขอคืนสินค้า',
  'order.viewGroup': 'ดูคำสั่งซื้อทั้งหมดจากการสั่งครั้งนี้',
  'order.rateTitle': 'ให้คะแนนสินค้าที่ซื้อ',
  'order.rateSubtitle': 'คะแนนของคุณจะแสดงต่อสาธารณะ และช่วยร้านอื่นตัดสินใจ',
  'order.cancelled': 'คำสั่งซื้อนี้ถูกยกเลิกแล้ว',
  'order.closed': 'คำสั่งซื้อนี้ปิดรายการแล้ว',

  // --- confirm delivered ---------------------------------------------------
  'order.confirmDelivered': 'ยืนยันรับสินค้า',
  'order.confirmDeliveredHint':
    'ยืนยันว่าคุณได้รับสินค้าแล้ว และปล่อยเงินให้แบรนด์',
  'order.confirmDeliveredAsk':
    'ยืนยันว่าได้รับสินค้าแล้วใช่ไหม? การยืนยันจะปิดคำสั่งซื้อและปล่อยเงินให้แบรนด์ และไม่สามารถย้อนกลับได้',

  // --- checkout group / confirmation ---------------------------------------
  'group.title': 'ส่งคำสั่งซื้อแล้ว',
  'group.heading': 'คำสั่งซื้อจากการสั่งครั้งนี้',
  'group.placed': 'ส่งคำสั่งซื้อเรียบร้อย ขอบคุณที่เลือกซื้อกับ metoo',
  'group.oneBrand': 'เมื่อเรายืนยันการชำระเงินแล้ว แบรนด์จะรับออร์เดอร์ของคุณ',
  'group.manyBrands':
    'ตะกร้าของคุณมีสินค้าจาก {n} แบรนด์ จึงแยกเป็น {n} คำสั่งซื้อ แต่ละรายการยืนยันและจัดส่งแยกกัน',
  'group.noPaymentYet':
    'ยังไม่มีการเรียกเก็บเงิน กรุณาโอนเงินแล้วส่งสลิปให้เรา เมื่อเรายืนยันแล้ว แบรนด์จะรับออร์เดอร์ของคุณ',
  'group.countOne': 'รวม {n} คำสั่งซื้อ',
  'group.countMany': 'รวม {n} คำสั่งซื้อ',
  'group.goToOrders': 'ไปที่คำสั่งซื้อของฉัน',

  // --- pay by PromptPay ----------------------------------------------------
  'pay.title': 'ชำระเงิน',
  'pay.heading': 'ชำระเงิน {number}',
  'pay.backToOrder': 'กลับไปที่คำสั่งซื้อ',
  'pay.qrAlt': 'คิวอาร์โค้ด PromptPay',
  'pay.noQr': 'ยังไม่ได้ตั้งค่า PromptPay QR กรุณาติดต่อทีมงานเพื่อชำระเงิน',
  'pay.amount': 'ยอดชำระ',
  'pay.reference': 'อ้างอิง',
  'pay.referenceHint':
    'กรุณาระบุเลขที่คำสั่งซื้อในหมายเหตุการโอน เพื่อให้เราจับคู่การชำระเงินกับคำสั่งซื้อนี้ได้',
  'pay.stillToPay':
    'คำสั่งซื้อจะอยู่ในสถานะ "{status}" จนกว่าเราจะยืนยันว่าได้รับเงินโอนแล้ว จากนั้นแบรนด์จึงจะรับออร์เดอร์',
  'slip.title': 'ส่งสลิปการโอนเงิน',
  'slip.hint':
    'อัปโหลดรูปถ่ายหรือไฟล์ PDF ของสลิป เมื่อเราตรวจสอบแล้ว แบรนด์จะเริ่มเตรียมสินค้าให้คุณ',
  'slip.upload': 'อัปโหลดสลิป',
  'slip.replace': 'อัปโหลดสลิปใหม่',
  'slip.sent': 'ได้รับสลิปแล้วเมื่อ {when} — เราจะตรวจสอบให้เร็วที่สุด',
  'slip.badType': 'รองรับไฟล์ JPG, PNG, WebP หรือ PDF เท่านั้น',
  'slip.tooLarge': 'ไฟล์มีขนาดเกิน 10 MB กรุณาใช้รูปที่เล็กลง',
  'slip.failed': 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',

  // --- saved ---------------------------------------------------------------
  'saved.title': 'ที่บันทึกไว้',
  'saved.tab.favourites': 'รายการโปรด',
  'saved.tab.later': 'เก็บไว้ซื้อภายหลัง',
  'saved.emptyFavourites': 'ยังไม่มีรายการโปรด',
  'saved.emptyFavouritesBody': 'กดรูปหัวใจที่สินค้าเพื่อเก็บไว้ที่นี่',
  'saved.emptyLater': 'ยังไม่มีสินค้าที่เก็บไว้ซื้อภายหลัง',
  'saved.emptyLaterBody': 'เก็บสินค้าที่ยังไม่พร้อมสั่งซื้อไว้ก่อนได้',
  'saved.addFavourite': 'เพิ่มในรายการโปรด',
  'saved.removeFavourite': 'ลบออกจากรายการโปรด',
  'saved.addLater': 'เก็บไว้ซื้อภายหลัง',
  'saved.removeLater': 'ลบออกจากรายการที่เก็บไว้ซื้อภายหลัง',

  // --- stores --------------------------------------------------------------
  'stores.title': 'ร้านค้า',
  'stores.following': 'แบรนด์ที่คุณติดตาม',
  'stores.all': 'แบรนด์ทั้งหมด',
  'stores.emptyTitle': 'ยังไม่มีแบรนด์',
  'stores.emptyBody': 'แบรนด์จะแสดงที่นี่เมื่อลงสินค้าชิ้นแรกแล้ว',
  'stores.isFollowing': 'กำลังติดตาม',
  'stores.follow': 'ติดตาม',
  'stores.followerOne': 'ผู้ติดตาม {n} คน',
  'stores.followerMany': 'ผู้ติดตาม {n} คน',
  'store.fallbackTitle': 'ร้านค้า',
  'store.productCount': 'สินค้า {n} รายการ',
  'store.memberSince': 'เข้าร่วมเมื่อ {date}',
  'store.noProducts': 'ยังไม่มีสินค้า',
  'store.noProductsBody': 'แบรนด์นี้ยังไม่ได้เผยแพร่สินค้า',

  // --- returns -------------------------------------------------------------
  'returns.title': 'คืนสินค้า/คืนเงิน',
  'returns.subtitle': 'ขอคืนสินค้าได้หลังจากที่คำสั่งซื้อจัดส่งแล้ว',
  'returns.emptyTitle': 'ยังไม่มีคำขอคืนสินค้า',
  'returns.emptyBody':
    'เมื่อคำสั่งซื้อจัดส่งแล้ว คุณสามารถขอคืนสินค้าได้จากหน้าคำสั่งซื้อ',
  'returns.REQUESTED': 'กำลังตรวจสอบ',
  'returns.ACCEPTED': 'คืนเงินแล้ว',
  'returns.REJECTED': 'ไม่อนุมัติ',
  'returns.reason': 'เหตุผล',
  'returns.response': 'คำตอบ',
  'returns.refunded': 'คืนเงินค่าสินค้าเข้ากระเป๋าเงินของคุณแล้ว',
  'returns.raised': 'ยื่นคำขอเมื่อ {date}',
  'returns.orderTotal': 'ยอดรวมคำสั่งซื้อ {amount}',

  // --- raise a return ------------------------------------------------------
  'returnNew.title': 'ขอคืนสินค้า',
  'returnNew.delivered': 'จัดส่งเมื่อ {date} · {amount}',
  'returnNew.deliveredRecently': 'เร็ว ๆ นี้',
  'returnNew.explainer':
    'แบรนด์จะตรวจสอบคำขอของคุณ หากอนุมัติ ระบบจะคืนเงินค่าสินค้าเข้ากระเป๋าเงินของคุณและปิดคำสั่งซื้อ',
  'returnNew.prompt': 'คำสั่งซื้อมีปัญหาอะไร?',
  'returnNew.placeholder':
    'อธิบายปัญหา — สินค้าเสียหาย ได้สินค้าผิด จำนวนไม่ครบ…',
  'returnNew.submit': 'ส่งคำขอ',

  // --- account settings ----------------------------------------------------
  'settings.title': 'ตั้งค่าบัญชี',
  'settings.subtitle': 'ข้อมูลร้านและการเข้าสู่ระบบ',
  'settings.picture': 'รูปร้าน',
  'settings.details': 'ข้อมูลร้าน',
  'settings.shopName': 'ชื่อร้าน',
  'settings.phone': 'เบอร์โทรศัพท์',
  'settings.address': 'ที่อยู่',
  'settings.addressHint':
    'ที่อยู่สำหรับจัดส่งคำสั่งซื้อในอนาคต คำสั่งซื้อที่สั่งไปแล้วจะใช้ที่อยู่เดิมที่ระบุตอนสั่งซื้อ',
  'settings.province': 'จังหวัด',
  'settings.postalCode': 'รหัสไปรษณีย์',
  'settings.taxId': 'เลขประจำตัวผู้เสียภาษี',
  'settings.saveFailed': 'บันทึกข้อมูลไม่สำเร็จ',

  // --- how your shop operates ----------------------------------------------
  'shopOps.title': 'ข้อมูลการดำเนินงานของร้าน',
  'shopOps.subtitle':
    'Metoo ใช้ข้อมูลนี้ในการจัดส่ง ต้องกรอกให้ครบก่อนจึงจะสั่งซื้อได้',
  'shopOps.stillNeeded':
    'กรอกข้อมูลเหล่านี้ให้ครบก่อนสั่งซื้อ ยังขาด: {fields}',
  'shopOps.chooseOne': 'เลือก 1 รายการ',
  'shopOps.shopType': 'ประเภทร้าน',
  'shopOps.zone': 'ทำเลหรือโซนที่ตั้ง',
  'shopOps.zonePlaceholder': 'เช่น สุขุมวิท ซอย 31',
  'shopOps.currentProducts': 'สินค้าที่ขายอยู่ตอนนี้',
  'shopOps.currentProductsPlaceholder': 'ขนม เครื่องดื่ม ของใช้ในบ้าน…',
  'shopOps.capacity': 'จำนวนออร์เดอร์ที่รับได้ต่อเดือน',
  'shopOps.capacityPlaceholder': 'เช่น 40',
  'shopOps.preferredPayment': 'วิธีชำระเงินที่สะดวก',
  'shopOps.deliveryWindow': 'ช่วงเวลาที่สะดวกรับสินค้า',
  'shopOps.deliveryWindowPlaceholder': 'เช่น วันธรรมดาช่วงเช้า 9:00–12:00 น.',
  'shopOps.save': 'บันทึกข้อมูลร้าน',

  // --- picture upload ------------------------------------------------------
  'picture.change': 'เปลี่ยนรูป',
  'picture.upload': 'อัปโหลดรูป',
  'picture.limits': 'ไฟล์ JPEG, PNG หรือ WebP ขนาดไม่เกิน 5 MB',
  'picture.badType': 'กรุณาใช้ไฟล์ภาพ JPEG, PNG หรือ WebP',
  'picture.tooLarge': 'ไฟล์ภาพมีขนาดเกิน 5 MB',
  'picture.failed': 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่',

  // --- change password -----------------------------------------------------
  'password.title': 'รหัสผ่าน',
  'password.subtitle': 'การเปลี่ยนรหัสผ่านจะออกจากระบบในอุปกรณ์อื่นทั้งหมด',
  'password.current': 'รหัสผ่านปัจจุบัน',
  'password.new': 'รหัสผ่านใหม่',
  'password.confirm': 'ยืนยันรหัสผ่านใหม่',
  'password.minimum': 'อย่างน้อย {n} ตัวอักษร',
  'password.mismatch': 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
  'password.tooShort': 'ใช้อย่างน้อย {n} ตัวอักษร',
  'password.unchanged': 'รหัสผ่านนี้คือรหัสผ่านเดิมของคุณ',
  'password.failed': 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
  'password.changed':
    'เปลี่ยนรหัสผ่านแล้ว อุปกรณ์อื่นที่เข้าสู่ระบบด้วยบัญชีนี้ถูกออกจากระบบทั้งหมด',
  'password.submit': 'เปลี่ยนรหัสผ่าน',

  // --- reviewing a product you bought --------------------------------------
  'review.edit': 'แก้ไข',
  'review.write': 'เขียนรีวิว',
  'review.submit': 'ส่งรีวิว',
  'review.update': 'แก้ไขรีวิว',
  'review.placeholder': 'สินค้าเป็นอย่างไรบ้าง? (ไม่บังคับ)',
  'review.pickStars': 'กรุณาเลือกจำนวนดาวก่อน',
  'review.ratingGroup': 'ให้คะแนนจาก 5 ดาว',
  'review.stars': '{n} ดาว',
  'review.outOf': '{n} จาก 5',
}
