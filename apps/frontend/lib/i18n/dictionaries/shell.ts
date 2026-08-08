/**
 * Chrome that wraps every screen: header nav, footer, the language toggle, and
 * the handful of verbs that appear on more than one surface.
 *
 * A string belongs here only if two unrelated screens use it. Anything owned by
 * one area lives in that area's file, even when the English happens to match —
 * "Save" on a settings form and "Save" on a favourites button are the same word
 * in English and different words in Thai.
 */

export const en = {
  // --- header --------------------------------------------------------------
  'nav.stores': 'Stores',
  'nav.home': 'Home',
  'nav.saved': 'Saved',
  'nav.orders': 'History',
  'nav.cart': 'Cart',
  'nav.account': 'Account',
  'nav.search': 'Search products and brands',
  'nav.logout': 'Log out',
  'nav.login': 'Log in',
  'nav.signup': 'Sign up',

  // --- language toggle -----------------------------------------------------
  'lang.label': 'Language',
  'lang.en': 'EN',
  'lang.th': 'ไทย',

  // --- footer --------------------------------------------------------------
  'footer.company': 'Company',
  'footer.about': 'About us',
  'footer.story': 'Our Story',
  'footer.careers': 'Careers',
  'footer.newsroom': 'Newsroom',
  'footer.blog': 'Blog',
  'footer.explore': 'Explore',
  'footer.howItWorks': 'How metoo works',
  'footer.findNiche': 'Find Your Niche',
  'footer.largeRetailers': 'Large retailers',
  'footer.referBrand': 'Refer a brand',
  'footer.help': 'Help',
  'footer.helpCenter': 'Help center',
  'footer.contactSeller': 'Contact Seller',
  'footer.sitemap': 'Sitemap',
  'footer.affiliates': 'Affiliates',
  'footer.legal': 'Legal',
  'footer.terms': 'Terms of Service',
  'footer.privacy': 'Privacy Policy',
  'footer.cookies': 'Cookie Policy',
  'footer.ip': 'IP Policy',
  'footer.accessibility': 'Accessibility Policy',
  'footer.location': 'Bangkok, Thailand',

  // --- verbs shared across surfaces ----------------------------------------
  'common.save': 'Save changes',
  'common.saved': 'Saved.',
  'common.cancel': 'Cancel',
  'common.back': 'Back',
  'common.close': 'Close',
  'common.optional': '(optional)',
  'common.loading': 'Loading…',
  'common.somethingWentWrong': 'Something went wrong. Please try again.',
} as const

export type Dict = typeof en

export const th: Record<keyof Dict, string> = {
  // --- header --------------------------------------------------------------
  'nav.stores': 'ร้านค้า',
  'nav.home': 'หน้าแรก',
  'nav.saved': 'ที่บันทึกไว้',
  'nav.orders': 'ประวัติการสั่งซื้อ',
  'nav.cart': 'ตะกร้า',
  'nav.account': 'บัญชี',
  'nav.search': 'ค้นหาสินค้าและแบรนด์',
  'nav.logout': 'ออกจากระบบ',
  'nav.login': 'เข้าสู่ระบบ',
  'nav.signup': 'สมัครสมาชิก',

  // --- language toggle -----------------------------------------------------
  'lang.label': 'ภาษา',
  // Each language names itself in its own script, so the option you cannot
  // currently read is still the one you can recognise.
  'lang.en': 'EN',
  'lang.th': 'ไทย',

  // --- footer --------------------------------------------------------------
  'footer.company': 'เกี่ยวกับบริษัท',
  'footer.about': 'เกี่ยวกับเรา',
  'footer.story': 'เรื่องราวของเรา',
  'footer.careers': 'ร่วมงานกับเรา',
  'footer.newsroom': 'ข่าวสาร',
  'footer.blog': 'บล็อก',
  'footer.explore': 'สำรวจ',
  'footer.howItWorks': 'metoo ทำงานอย่างไร',
  'footer.findNiche': 'ค้นหาสินค้าที่ใช่',
  'footer.largeRetailers': 'ร้านค้าขนาดใหญ่',
  'footer.referBrand': 'แนะนำแบรนด์',
  'footer.help': 'ช่วยเหลือ',
  'footer.helpCenter': 'ศูนย์ช่วยเหลือ',
  'footer.contactSeller': 'ติดต่อผู้ขาย',
  'footer.sitemap': 'แผนผังเว็บไซต์',
  'footer.affiliates': 'พันธมิตร',
  'footer.legal': 'ข้อกำหนดและนโยบาย',
  'footer.terms': 'ข้อกำหนดการใช้บริการ',
  'footer.privacy': 'นโยบายความเป็นส่วนตัว',
  'footer.cookies': 'นโยบายคุกกี้',
  'footer.ip': 'นโยบายทรัพย์สินทางปัญญา',
  'footer.accessibility': 'นโยบายการเข้าถึง',
  'footer.location': 'กรุงเทพมหานคร ประเทศไทย',

  // --- verbs shared across surfaces ----------------------------------------
  'common.save': 'บันทึกการเปลี่ยนแปลง',
  'common.saved': 'บันทึกแล้ว',
  'common.cancel': 'ยกเลิก',
  'common.back': 'ย้อนกลับ',
  'common.close': 'ปิด',
  'common.optional': '(ไม่บังคับ)',
  'common.loading': 'กำลังโหลด…',
  'common.somethingWentWrong': 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
}
