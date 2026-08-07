/**
 * UI copy, in both languages.
 *
 * Keyed rather than translating English strings at runtime: two screens can
 * legitimately show the same English word and need different Thai, and a
 * key survives a copy edit that a string lookup would not.
 *
 * `en` is the source of truth for what keys exist — `th` is typed against it,
 * so adding an English string without a Thai one fails the build rather than
 * silently falling back in front of a Thai shopkeeper.
 *
 * Thai is the market language. Where a term is genuinely used in English by
 * Thai retailers (PromptPay, อย.) it stays as it is spoken, not translated
 * into something nobody says out loud.
 */

export const en = {
  // --- shell ---------------------------------------------------------------
  'nav.stores': 'Stores',
  'nav.saved': 'Saved',
  'nav.orders': 'Orders',
  'nav.cart': 'Cart',
  'nav.account': 'Account',
  'nav.search': 'Search products and brands',
  'nav.logout': 'Log out',
  'lang.label': 'Language',
  'lang.en': 'EN',
  'lang.th': 'ไทย',

  // --- auth ----------------------------------------------------------------
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.login': 'Log in',
  'auth.showPassword': 'Show password',
  'auth.hidePassword': 'Hide password',
  'auth.shop.title': 'Welcome back',
  'auth.shop.subtitle': 'Sign in to browse wholesale pricing and place orders.',
  'auth.seller.title': 'Seller Centre',
  'auth.seller.subtitle':
    'Sign in to manage your products, orders and payouts.',
  'auth.admin.title': 'Management Console',
  'auth.admin.subtitle': 'Staff sign-in.',
  'auth.newHere': 'New to Metoo?',
  'auth.signUpToBuy': 'Sign up to buy',
  'auth.sellingHere': 'Selling on Metoo?',
  'auth.sellerCentre': 'Seller Centre',
  'auth.buyingInstead': 'Buying instead?',
  'auth.shopSignIn': 'Shop sign-in',
  'auth.sellOnMetoo': 'Sell on Metoo',
  'auth.badCredentials': 'Email or password is incorrect.',
  'auth.unreachable':
    'Cannot reach the server. Check your connection and try again.',

  // --- explore -------------------------------------------------------------
  'explore.title': 'Explore',
  'explore.all': 'All',
  'explore.noPhoto': 'No photo',
  'explore.perPack': '/pack',
  'explore.noResults': 'No products match that search.',

  // --- product -------------------------------------------------------------
  'product.perPack': 'per pack',
  'product.unitsPerPack': 'units/pack',
  'product.unitPerPack': 'unit/pack',
  'product.minPacks': 'min {n} packs',
  'product.stock': 'Stock',
  'product.madeToOrder': 'Made to order',
  'product.packs': 'packs',
  'product.addToCart': 'Add to Cart',
  'product.outOfStock': 'Out of stock',
  'product.minimumOrder': 'Minimum order {n} packs.',
  'product.description': 'Description',
  'product.reviews': 'Reviews',
  'product.noReviews': 'No reviews yet',

  // --- cart ----------------------------------------------------------------
  'cart.title': 'Shopping Cart',
  'cart.empty': 'Your cart is empty.',
  'cart.checkout': 'Check Out',
  'cart.continue': 'Continue shopping',
  'cart.subtotal': 'Subtotal',
  'cart.total': 'Total',
  'cart.remove': 'Remove',
  'cart.splitNotice':
    'Your cart spans {n} brands, so it will be placed as {n} separate orders — one per brand, each tracked and delivered on its own.',
  'cart.profileNeeded':
    'Before your first order we need a few details about your shop so we can arrange delivery: {fields}.',
  'cart.completeProfile': 'Complete your shop profile',

  // --- orders --------------------------------------------------------------
  'orders.title': 'My Purchase',
  'orders.tab.all': 'All',
  'orders.tab.toPay': 'To Pay',
  'orders.tab.toShip': 'To Ship',
  'orders.tab.toReceive': 'To Receive',
  'orders.tab.completed': 'Completed',
  'orders.tab.cancelled': 'Cancelled',
  'orders.tab.returns': 'Return Refund',
  'orders.orderTotal': 'Order Total',
  'orders.pay': 'Pay',
  'orders.track': 'Track',
  'orders.productsOrdered': 'Products Ordered',
  'orders.deliveryAddress': 'Delivery Address',
  'orders.placed': 'Placed',
  'orders.confirmDelivered': 'Confirm Delivered',
  'orders.confirmDeliveredHint':
    'Confirms you received the goods and releases payment to the brand.',
  'orders.confirmDeliveredAsk':
    'Confirm you received this order? This completes it and releases payment to the brand. It cannot be undone.',
  'orders.requestReturn': 'Request a return',
  'orders.rateTitle': 'Rate what you bought',
  'orders.rateSubtitle': 'Your rating is public and helps other shops decide.',
  'orders.submitReview': 'Submit review',
  'orders.updateReview': 'Update review',
  'orders.reviewPlaceholder': 'How was it? (optional)',
  'orders.priceNote':
    'Prices shown are those at the time the order was placed.',

  // --- order status, as the buyer reads it ---------------------------------
  'status.PENDING': 'To Pay',
  'status.CONFIRMED': 'Confirmed',
  'status.READY_FOR_PICKUP': 'Package Pickup',
  'status.PICKED_UP': 'Out for Delivery',
  'status.DELIVERED': 'Delivered',
  'status.SETTLED': 'Completed',
  'status.CANCELLED': 'Cancelled',
  'status.CLOSED': 'Closed',

  // --- categories ----------------------------------------------------------
  'category.FOOD_BEVERAGE': 'Food & Beverage',
  'category.HEALTH_BEAUTY': 'Health & Beauty',
  'category.HOME_LIVING': 'Home & Living',
  'category.FASHION_ACCESSORIES': 'Fashion & Accessories',

  // --- landing -------------------------------------------------------------
  'landing.signUpToBuy': 'Sign up to buy',
  'landing.signUpAsBrand': 'Sign up as a brand',
  'landing.haveAccount': 'I already have an account',
  'landing.areYouBrand': 'Are you a brand?',

  // --- settings ------------------------------------------------------------
  'settings.title': 'Account settings',
  'settings.subtitle': 'Your shop details and sign-in.',
  'settings.picture': 'Shop picture',
  'settings.details': 'Shop details',
  'settings.operations': 'How your shop operates',
  'settings.operationsHint':
    'Metoo needs these to arrange delivery. They must be filled in before you can place an order.',
  'settings.save': 'Save changes',
  'settings.saved': 'Saved.',
  'settings.shopName': 'Shop name',
  'settings.phone': 'Phone',
  'settings.address': 'Address',
  'settings.province': 'Province',
  'settings.postalCode': 'Postal code',
  'settings.taxId': 'Tax ID',
  'settings.optional': '(optional)',
} as const

export type Dict = typeof en
export type MessageKey = keyof Dict

export const th: Record<MessageKey, string> = {
  // --- shell ---------------------------------------------------------------
  'nav.stores': 'ร้านค้า',
  'nav.saved': 'ที่บันทึกไว้',
  'nav.orders': 'คำสั่งซื้อ',
  'nav.cart': 'ตะกร้า',
  'nav.account': 'บัญชี',
  'nav.search': 'ค้นหาสินค้าและแบรนด์',
  'nav.logout': 'ออกจากระบบ',
  'lang.label': 'ภาษา',
  'lang.en': 'EN',
  'lang.th': 'ไทย',

  // --- auth ----------------------------------------------------------------
  'auth.email': 'อีเมล',
  'auth.password': 'รหัสผ่าน',
  'auth.login': 'เข้าสู่ระบบ',
  'auth.showPassword': 'แสดงรหัสผ่าน',
  'auth.hidePassword': 'ซ่อนรหัสผ่าน',
  'auth.shop.title': 'ยินดีต้อนรับกลับ',
  'auth.shop.subtitle': 'เข้าสู่ระบบเพื่อดูราคาส่งและสั่งซื้อสินค้า',
  'auth.seller.title': 'ศูนย์ผู้ขาย',
  'auth.seller.subtitle':
    'เข้าสู่ระบบเพื่อจัดการสินค้า คำสั่งซื้อ และการรับเงิน',
  'auth.admin.title': 'ระบบจัดการหลังบ้าน',
  'auth.admin.subtitle': 'สำหรับเจ้าหน้าที่',
  'auth.newHere': 'ยังไม่มีบัญชี?',
  'auth.signUpToBuy': 'สมัครเพื่อสั่งซื้อ',
  'auth.sellingHere': 'ต้องการขายสินค้า?',
  'auth.sellerCentre': 'ศูนย์ผู้ขาย',
  'auth.buyingInstead': 'ต้องการสั่งซื้อ?',
  'auth.shopSignIn': 'เข้าสู่ระบบผู้ซื้อ',
  'auth.sellOnMetoo': 'ขายสินค้ากับ Metoo',
  'auth.badCredentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth.unreachable':
    'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',

  // --- explore -------------------------------------------------------------
  'explore.title': 'สำรวจสินค้า',
  'explore.all': 'ทั้งหมด',
  'explore.noPhoto': 'ไม่มีรูปภาพ',
  'explore.perPack': '/แพ็ก',
  'explore.noResults': 'ไม่พบสินค้าที่ค้นหา',

  // --- product -------------------------------------------------------------
  'product.perPack': 'ต่อแพ็ก',
  'product.unitsPerPack': 'ชิ้น/แพ็ก',
  'product.unitPerPack': 'ชิ้น/แพ็ก',
  'product.minPacks': 'ขั้นต่ำ {n} แพ็ก',
  'product.stock': 'สต็อก',
  'product.madeToOrder': 'ผลิตตามสั่ง',
  'product.packs': 'แพ็ก',
  'product.addToCart': 'เพิ่มลงตะกร้า',
  'product.outOfStock': 'สินค้าหมด',
  'product.minimumOrder': 'สั่งซื้อขั้นต่ำ {n} แพ็ก',
  'product.description': 'รายละเอียดสินค้า',
  'product.reviews': 'รีวิว',
  'product.noReviews': 'ยังไม่มีรีวิว',

  // --- cart ----------------------------------------------------------------
  'cart.title': 'ตะกร้าสินค้า',
  'cart.empty': 'ยังไม่มีสินค้าในตะกร้า',
  'cart.checkout': 'สั่งซื้อ',
  'cart.continue': 'เลือกซื้อสินค้าต่อ',
  'cart.subtotal': 'ยอดรวมสินค้า',
  'cart.total': 'ยอดรวมทั้งหมด',
  'cart.remove': 'ลบ',
  'cart.splitNotice':
    'ตะกร้าของคุณมีสินค้าจาก {n} แบรนด์ ระบบจะแยกเป็น {n} คำสั่งซื้อ แบรนด์ละ 1 รายการ ติดตามและจัดส่งแยกกัน',
  'cart.profileNeeded':
    'ก่อนสั่งซื้อครั้งแรก เราต้องการข้อมูลร้านของคุณเพื่อจัดส่ง: {fields}',
  'cart.completeProfile': 'กรอกข้อมูลร้านให้ครบ',

  // --- orders --------------------------------------------------------------
  'orders.title': 'คำสั่งซื้อของฉัน',
  'orders.tab.all': 'ทั้งหมด',
  'orders.tab.toPay': 'รอชำระเงิน',
  'orders.tab.toShip': 'รอจัดส่ง',
  'orders.tab.toReceive': 'รอรับสินค้า',
  'orders.tab.completed': 'สำเร็จ',
  'orders.tab.cancelled': 'ยกเลิก',
  'orders.tab.returns': 'คืนสินค้า/คืนเงิน',
  'orders.orderTotal': 'ยอดรวม',
  'orders.pay': 'ชำระเงิน',
  'orders.track': 'ติดตามสถานะ',
  'orders.productsOrdered': 'รายการสินค้า',
  'orders.deliveryAddress': 'ที่อยู่จัดส่ง',
  'orders.placed': 'สั่งซื้อเมื่อ',
  'orders.confirmDelivered': 'ยืนยันรับสินค้า',
  'orders.confirmDeliveredHint':
    'ยืนยันว่าคุณได้รับสินค้าแล้ว และปล่อยเงินให้แบรนด์',
  'orders.confirmDeliveredAsk':
    'ยืนยันว่าได้รับสินค้าแล้วใช่ไหม? การยืนยันจะปิดคำสั่งซื้อและปล่อยเงินให้แบรนด์ และไม่สามารถย้อนกลับได้',
  'orders.requestReturn': 'ขอคืนสินค้า',
  'orders.rateTitle': 'ให้คะแนนสินค้าที่ซื้อ',
  'orders.rateSubtitle': 'คะแนนของคุณจะแสดงต่อสาธารณะ และช่วยร้านอื่นตัดสินใจ',
  'orders.submitReview': 'ส่งรีวิว',
  'orders.updateReview': 'แก้ไขรีวิว',
  'orders.reviewPlaceholder': 'สินค้าเป็นอย่างไรบ้าง? (ไม่บังคับ)',
  'orders.priceNote': 'ราคาที่แสดงคือราคา ณ เวลาที่สั่งซื้อ',

  // --- order status, as the buyer reads it ---------------------------------
  'status.PENDING': 'รอชำระเงิน',
  'status.CONFIRMED': 'ยืนยันแล้ว',
  'status.READY_FOR_PICKUP': 'รอเข้ารับพัสดุ',
  'status.PICKED_UP': 'กำลังจัดส่ง',
  'status.DELIVERED': 'จัดส่งแล้ว',
  'status.SETTLED': 'สำเร็จ',
  'status.CANCELLED': 'ยกเลิก',
  'status.CLOSED': 'ปิดรายการ',

  // --- categories ----------------------------------------------------------
  'category.FOOD_BEVERAGE': 'อาหารและเครื่องดื่ม',
  'category.HEALTH_BEAUTY': 'สุขภาพและความงาม',
  'category.HOME_LIVING': 'ของใช้ในบ้าน',
  'category.FASHION_ACCESSORIES': 'แฟชั่นและเครื่องประดับ',

  // --- landing -------------------------------------------------------------
  'landing.signUpToBuy': 'สมัครเพื่อสั่งซื้อ',
  'landing.signUpAsBrand': 'สมัครเป็นแบรนด์',
  'landing.haveAccount': 'มีบัญชีอยู่แล้ว',
  'landing.areYouBrand': 'คุณเป็นแบรนด์ใช่ไหม?',

  // --- settings ------------------------------------------------------------
  'settings.title': 'ตั้งค่าบัญชี',
  'settings.subtitle': 'ข้อมูลร้านและการเข้าสู่ระบบ',
  'settings.picture': 'รูปร้าน',
  'settings.details': 'ข้อมูลร้าน',
  'settings.operations': 'ข้อมูลการดำเนินงานของร้าน',
  'settings.operationsHint':
    'Metoo ใช้ข้อมูลนี้ในการจัดส่ง ต้องกรอกให้ครบก่อนจึงจะสั่งซื้อได้',
  'settings.save': 'บันทึกการเปลี่ยนแปลง',
  'settings.saved': 'บันทึกแล้ว',
  'settings.shopName': 'ชื่อร้าน',
  'settings.phone': 'เบอร์โทรศัพท์',
  'settings.address': 'ที่อยู่',
  'settings.province': 'จังหวัด',
  'settings.postalCode': 'รหัสไปรษณีย์',
  'settings.taxId': 'เลขประจำตัวผู้เสียภาษี',
  'settings.optional': '(ไม่บังคับ)',
}

export const DICTIONARIES = { en, th } as const
