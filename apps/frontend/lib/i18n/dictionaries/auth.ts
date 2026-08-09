/**
 * Everything before the session: the landing page, the three logins, both
 * signup forms, and the pending-approval screen.
 *
 * This is the first Thai a shopkeeper reads, and for a while it was the last
 * English they saw — the default locale is Thai, so an untranslated landing
 * page was the app breaking its own promise on the first screen.
 */

export const en = {
  // --- login ---------------------------------------------------------------
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
  'auth.sellerDoorHint': 'Sellers sign in at Seller Centre.',
  // Its own key rather than reusing the sign-in one: this sits on the signup
  // form, where "sign in" would be the wrong verb.
  'auth.brandSignupHint': 'Brands sign up at Seller Centre.',
  'auth.buyingInstead': 'Buying instead?',
  'auth.shopSignIn': 'Shop sign-in',
  'auth.sellOnMetoo': 'Sell on Metoo',
  'auth.badCredentials': 'Email or password is incorrect.',
  // Named per role rather than one sentence with the site interpolated: Thai
  // does not put the name in the same place, and a translator should see the
  // whole sentence.
  'auth.wrongPortal.BRAND':
    'That is a seller account. Your password is fine — sign in at Seller Centre.',
  'auth.wrongPortal.RETAILER':
    'That is a shop account. Your password is fine — sign in on the shop.',
  'auth.wrongPortal.ADMIN':
    'That is a staff account. Your password is fine — sign in on the console.',
  'auth.wrongPortal.go': 'Go to the right sign-in page',
  'auth.unreachable':
    'Cannot reach the server. Check your connection and try again.',

  // --- landing -------------------------------------------------------------
  'landing.heroLead': 'The best selection of brands for your store,',
  'landing.heroAccent': 'all in one place',
  'landing.heroBody':
    'Sign up to unlock wholesale pricing with over 5 brands. Order across multiple brands in one cart, track every delivery, and pay on your terms.',
  'landing.signUpToBuy': 'Sign up to buy',
  'landing.signUpAsBrand': 'Sign up as a brand',
  'landing.haveAccount': 'I already have an account',
  'landing.areYouBrand': 'Are you a brand?',
  'landing.browseTitle': 'Browse local brands',
  'landing.browseBody':
    'Food & beverage, health & beauty, home & living and fashion — every brand vetted and อย.-checked before it can sell.',
  'landing.cartTitle': 'One cart, many brands',
  'landing.cartBody':
    'Fill a single cart across brands. At checkout it splits into one order per brand, so a delay at one never holds up another.',
  'landing.trackTitle': 'Track every order',
  'landing.trackBody':
    'From confirmed through pickup and delivery — you always know where a shipment is.',

  // --- signup, shared between the two forms --------------------------------
  'signup.create': 'Create account',
  'signup.failed': 'Could not create your account.',
  'signup.passwordHint': 'At least 8 characters.',
  'signup.phone': 'Phone number',
  'signup.addressLine': 'Street name, building, house no.',
  'signup.province': 'Province',
  'signup.postalCode': 'Postal code',

  // --- retailer signup -----------------------------------------------------
  'signup.retailer.title': 'Sign up to buy',
  'signup.retailer.subtitle':
    'Welcome! Create your account to unlock wholesale pricing.',
  'signup.retailer.shopName': 'Shop name',
  'signup.retailer.taxId': 'Tax ID (optional)',
  'signup.retailer.haveAccount': 'Already have an account?',
  'signup.retailer.areYouBrand': 'Are you a brand?',

  // --- brand signup --------------------------------------------------------
  'signup.brand.title': 'Sell on Metoo',
  'signup.brand.subtitle':
    'Create your brand account. We will be in touch to walk you through onboarding.',
  'signup.brand.name': 'Brand name',
  'signup.brand.about': 'About your brand (optional)',
  'signup.brand.aboutPlaceholder': 'What you make, and who buys it today.',
  'signup.brand.alreadySelling': 'Already selling with us?',
  'signup.brand.sellerLogin': 'Seller Centre log in',
  'signup.brand.buyingInstead': 'Looking to buy instead?',

  // --- pending approval ----------------------------------------------------
  'pending.title': 'Account under review',
  'pending.status': 'Status',
  'pending.noteTitle': 'A note from our team',
  'pending.NOT_CONTACTED.title': 'Your account is under review',
  'pending.NOT_CONTACTED.body':
    'Thanks for signing up. Our team reviews every shop before opening wholesale pricing — we will be in touch shortly.',
  'pending.CONTACTED.title': 'We have been in touch',
  'pending.CONTACTED.body':
    'Someone from our team has reached out. Once we have finished going through your details, your account will be opened.',
  'pending.INTERESTED.title': 'Almost there',
  'pending.INTERESTED.body':
    'Your shop is being set up. You will be able to browse the catalog as soon as onboarding is complete.',
  'pending.ONBOARDED.title': 'You are approved',
  'pending.ONBOARDED.body': 'Your account is active.',
  'pending.DECLINED.title': 'We could not approve this account',
  'pending.DECLINED.body':
    'Unfortunately we are unable to open wholesale access for this shop at the moment.',
} as const

export type Dict = typeof en

export const th: Record<keyof Dict, string> = {
  // --- login ---------------------------------------------------------------
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
  'auth.sellerDoorHint': 'ผู้ขายเข้าสู่ระบบที่ศูนย์ผู้ขาย',
  'auth.brandSignupHint': 'แบรนด์สมัครที่ศูนย์ผู้ขาย',
  'auth.buyingInstead': 'ต้องการสั่งซื้อ?',
  'auth.shopSignIn': 'เข้าสู่ระบบผู้ซื้อ',
  'auth.sellOnMetoo': 'ขายสินค้ากับ Metoo',
  'auth.badCredentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  'auth.wrongPortal.BRAND':
    'นี่เป็นบัญชีผู้ขาย รหัสผ่านของคุณถูกต้อง กรุณาเข้าสู่ระบบที่ Seller Centre',
  'auth.wrongPortal.RETAILER':
    'นี่เป็นบัญชีร้านค้าปลีก รหัสผ่านของคุณถูกต้อง กรุณาเข้าสู่ระบบที่หน้าร้าน',
  'auth.wrongPortal.ADMIN':
    'นี่เป็นบัญชีเจ้าหน้าที่ รหัสผ่านของคุณถูกต้อง กรุณาเข้าสู่ระบบที่ระบบจัดการหลังบ้าน',
  'auth.wrongPortal.go': 'ไปที่หน้าเข้าสู่ระบบที่ถูกต้อง',
  'auth.unreachable':
    'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',

  // --- landing -------------------------------------------------------------
  'landing.heroLead': 'รวมแบรนด์ที่ดีที่สุดสำหรับร้านของคุณ',
  'landing.heroAccent': 'ไว้ในที่เดียว',
  'landing.heroBody':
    'สมัครเพื่อดูราคาส่งจากแบรนด์กว่า 5 แบรนด์ สั่งซื้อข้ามแบรนด์ได้ในตะกร้าเดียว ติดตามการจัดส่งทุกรายการ และเลือกวิธีชำระเงินที่สะดวกกับคุณ',
  'landing.signUpToBuy': 'สมัครเพื่อสั่งซื้อ',
  'landing.signUpAsBrand': 'สมัครเป็นแบรนด์',
  'landing.haveAccount': 'มีบัญชีอยู่แล้ว',
  'landing.areYouBrand': 'คุณเป็นแบรนด์ใช่ไหม?',
  'landing.browseTitle': 'เลือกซื้อจากแบรนด์ไทย',
  'landing.browseBody':
    'อาหารและเครื่องดื่ม สุขภาพและความงาม ของใช้ในบ้าน และแฟชั่น — ทุกแบรนด์ผ่านการตรวจสอบและเช็ค อย. ก่อนเปิดขาย',
  'landing.cartTitle': 'ตะกร้าเดียว หลายแบรนด์',
  'landing.cartBody':
    'ใส่สินค้าจากหลายแบรนด์ในตะกร้าเดียว ตอนสั่งซื้อระบบจะแยกเป็นออร์เดอร์ละแบรนด์ ความล่าช้าของแบรนด์หนึ่งจึงไม่กระทบอีกแบรนด์',
  'landing.trackTitle': 'ติดตามได้ทุกออร์เดอร์',
  'landing.trackBody':
    'ตั้งแต่ยืนยันออร์เดอร์ เข้ารับพัสดุ จนถึงจัดส่ง — คุณรู้เสมอว่าสินค้าอยู่ตรงไหน',

  // --- signup, shared between the two forms --------------------------------
  'signup.create': 'สร้างบัญชี',
  'signup.failed': 'สร้างบัญชีไม่สำเร็จ',
  'signup.passwordHint': 'อย่างน้อย 8 ตัวอักษร',
  'signup.phone': 'เบอร์โทรศัพท์',
  'signup.addressLine': 'ชื่อถนน อาคาร บ้านเลขที่',
  'signup.province': 'จังหวัด',
  'signup.postalCode': 'รหัสไปรษณีย์',

  // --- retailer signup -----------------------------------------------------
  'signup.retailer.title': 'สมัครเพื่อสั่งซื้อ',
  'signup.retailer.subtitle': 'ยินดีต้อนรับ! สร้างบัญชีเพื่อดูราคาส่ง',
  'signup.retailer.shopName': 'ชื่อร้าน',
  'signup.retailer.taxId': 'เลขประจำตัวผู้เสียภาษี (ไม่บังคับ)',
  'signup.retailer.haveAccount': 'มีบัญชีอยู่แล้ว?',
  'signup.retailer.areYouBrand': 'คุณเป็นแบรนด์ใช่ไหม?',

  // --- brand signup --------------------------------------------------------
  'signup.brand.title': 'ขายสินค้ากับ Metoo',
  'signup.brand.subtitle':
    'สร้างบัญชีแบรนด์ของคุณ ทีมงานจะติดต่อกลับเพื่อพาคุณเริ่มต้นใช้งาน',
  'signup.brand.name': 'ชื่อแบรนด์',
  'signup.brand.about': 'เกี่ยวกับแบรนด์ของคุณ (ไม่บังคับ)',
  'signup.brand.aboutPlaceholder': 'คุณผลิตอะไร และตอนนี้ใครเป็นลูกค้าของคุณ',
  'signup.brand.alreadySelling': 'ขายกับเราอยู่แล้ว?',
  'signup.brand.sellerLogin': 'เข้าสู่ระบบศูนย์ผู้ขาย',
  'signup.brand.buyingInstead': 'ต้องการสั่งซื้อแทน?',

  // --- pending approval ----------------------------------------------------
  'pending.title': 'บัญชีอยู่ระหว่างตรวจสอบ',
  'pending.status': 'สถานะ',
  'pending.noteTitle': 'ข้อความจากทีมงาน',
  'pending.NOT_CONTACTED.title': 'บัญชีของคุณอยู่ระหว่างตรวจสอบ',
  'pending.NOT_CONTACTED.body':
    'ขอบคุณที่สมัครใช้งาน ทีมงานตรวจสอบทุกร้านก่อนเปิดให้เห็นราคาส่ง เราจะติดต่อกลับโดยเร็ว',
  'pending.CONTACTED.title': 'เราติดต่อคุณแล้ว',
  'pending.CONTACTED.body':
    'ทีมงานได้ติดต่อคุณไปแล้ว เมื่อตรวจสอบข้อมูลเรียบร้อย บัญชีของคุณจะถูกเปิดใช้งาน',
  'pending.INTERESTED.title': 'อีกนิดเดียว',
  'pending.INTERESTED.body':
    'กำลังตั้งค่าร้านของคุณ คุณจะเลือกซื้อสินค้าได้ทันทีที่ตั้งค่าเสร็จ',
  'pending.ONBOARDED.title': 'บัญชีของคุณได้รับอนุมัติแล้ว',
  'pending.ONBOARDED.body': 'บัญชีของคุณพร้อมใช้งาน',
  'pending.DECLINED.title': 'เราไม่สามารถอนุมัติบัญชีนี้ได้',
  'pending.DECLINED.body':
    'ขออภัย ขณะนี้เรายังไม่สามารถเปิดการขายส่งให้ร้านนี้ได้',
}
