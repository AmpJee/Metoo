/**
 * The help centre.
 *
 * Every answer here is derived from what the platform actually does — the
 * shipping bands in `packages/shared/src/shipping.ts`, the commission table in
 * `domain/commission.ts`, the order states in `domain/order-state.ts`, the
 * documents in the upload rules. Nothing is invented: a help page that
 * describes a policy the code does not implement is worse than no help page,
 * because someone will hold you to it.
 *
 * Where a number appears, it is interpolated from the constant rather than
 * typed out, so a rate card change cannot leave this page lying.
 */

export const en = {
  'help.metaTitle': 'Help centre',
  'help.title': 'Help centre',
  'help.subtitle':
    'How buying and selling on metoo works. If your question is not here, email us.',

  // --- buying ----------------------------------------------------------------
  'help.buying': 'Buying on metoo',

  'help.q.startBuying': 'How do I start buying?',
  'help.a.startBuying':
    'Anyone can browse the catalog and see wholesale prices without an account. ' +
    'To order, sign up as a shop. We check every shop before approving it, so ' +
    'there is a short wait — you can sign in during that time, you just cannot ' +
    'order yet.',

  'help.q.pending': 'Why does my account say it is under review?',
  'help.a.pending':
    'Every new shop is reviewed by a person before it can order. It is one ' +
    'step and it is not automatic. You will be contacted; nothing more is ' +
    'needed from you in the meantime.',

  'help.q.minimum': 'Why can I not order just one?',
  'help.a.minimum':
    'This is wholesale, so each brand sets a minimum number of packs for its ' +
    'own products. The minimum is shown on every product, and the quantity box ' +
    'will not go below it.',

  'help.q.volume': 'Why did the price per pack change when I ordered more?',
  'help.a.volume':
    'Brands can set volume pricing: a lower price per pack once you pass a ' +
    'quantity they choose. When you cross one of those thresholds the whole ' +
    'order gets the lower price, not just the extra packs.',

  'help.q.split': 'Why did my basket become several orders?',
  'help.a.split':
    'One order per brand. Each brand packs and sends its own parcel and is ' +
    'paid separately, so a basket with three brands becomes three orders, each ' +
    'with its own total and its own delivery.',

  'help.q.pay': 'How do I pay?',
  'help.a.pay':
    'By PromptPay transfer. Open the order, scan the QR, and put the order ' +
    'number in the transfer note — that is how we match your payment. Then ' +
    'upload a photo of the slip on the same screen. We check it and confirm ' +
    'the payment, and the brand accepts your order after that.',

  'help.q.slip': 'I transferred but the order still says awaiting payment.',
  'help.a.slip':
    'That is normal until we have checked your slip. Uploading it is not the ' +
    'same as being paid — a person confirms the money arrived. If you have not ' +
    'uploaded a slip yet, do that first: without it we have no way to match ' +
    'your transfer.',

  'help.q.delivery': 'How much is delivery?',
  'help.a.delivery':
    'Charged per brand order and priced by parcel weight: {b1} up to 1 kg, ' +
    '{b2} up to 3 kg, {b3} up to 5 kg, {b4} up to 10 kg, {b5} up to 20 kg, ' +
    'then {perKg} per kilo above that. Delivery is free on any brand order ' +
    'over {free}. Your first order is free whatever it costs.',

  'help.q.stages': 'What do the order stages mean?',
  'help.a.stages':
    'Awaiting payment, then payment received once we have checked your slip, ' +
    'then confirmed when the brand accepts. After that: package pickup, out ' +
    'for delivery, delivered. The last step is yours — confirming you received ' +
    'the goods is what releases the brand’s money, so please do it promptly.',

  'help.q.returns': 'Can I return something?',
  'help.a.returns':
    'Returns can be requested after an order is delivered, not before. Open ' +
    'the order and start a return there.',

  // --- selling ---------------------------------------------------------------
  'help.selling': 'Selling on metoo',

  'help.q.sellerSite': 'Where do sellers sign in?',
  'help.a.sellerSite':
    'At Seller Centre, which is a separate sign-in from the shop. If you ' +
    'registered as a brand and try the shop’s login, it will tell you so and ' +
    'link you to the right page.',

  'help.q.documents': 'What do I need to sell?',
  'help.a.documents':
    'An SME registration or a National ID, plus your อย. (Thai FDA) ' +
    'certificate. An admin reviews them before your products go live.',

  'help.q.commission': 'What commission does metoo take?',
  'help.a.commission':
    'It depends on the product category, and it drops once a brand is doing ' +
    'more than {threshold} orders a month: Food & Beverage {fb}, Health & ' +
    'Beauty {hb}, Home & Living {hl}, Fashion & Accessories {fa}. The rate is ' +
    'fixed onto each order when it is placed, so a later change never rewrites ' +
    'what you already earned.',

  'help.q.payout': 'When and how do I get paid?',
  'help.a.payout':
    'The sale is credited to your metoo wallet when the buyer confirms they ' +
    'received the goods. From your wallet you request a withdrawal, and an ' +
    'admin transfers it to your bank account.',

  'help.q.shippingPayout': 'Does delivery come out of my payout?',
  'help.a.shippingPayout':
    'No. metoo collects the delivery fee and pays the courier. Commission is ' +
    'charged on the goods only, never on delivery, and your payout is the ' +
    'order subtotal minus commission.',

  // --- account ---------------------------------------------------------------
  'help.account': 'Account',

  'help.q.twoSites': 'Why are there two different sign-in pages?',
  'help.a.twoSites':
    'Shops and brands use different sites, so each one can turn away the wrong ' +
    'kind of account instead of letting you in and then blocking every screen. ' +
    'If you land on the wrong one, it will say so and link you across.',

  'help.q.forgotPassword': 'I forgot my password.',
  'help.a.forgotPassword':
    'There is no self-service reset yet. Email us from the address on the ' +
    'account and we will sort it out.',

  'help.q.language': 'Can I use the site in English?',
  'help.a.language':
    'Yes — the EN / ไทย switch is in the header on every page, and it remembers ' +
    'your choice.',

  // --- contact ---------------------------------------------------------------
  'help.contactTitle': 'Still stuck?',
  'help.contactBody': 'Email us and we will get back to you.',
}

export const th: Record<keyof typeof en, string> = {
  'help.metaTitle': 'ศูนย์ช่วยเหลือ',
  'help.title': 'ศูนย์ช่วยเหลือ',
  'help.subtitle':
    'วิธีซื้อและวิธีขายบน metoo หากไม่พบคำตอบที่ต้องการ ส่งอีเมลหาเราได้เลย',

  'help.buying': 'สำหรับร้านค้าที่สั่งซื้อ',

  'help.q.startBuying': 'เริ่มสั่งซื้อได้อย่างไร',
  'help.a.startBuying':
    'ทุกคนดูสินค้าและราคาส่งได้โดยไม่ต้องมีบัญชี หากต้องการสั่งซื้อ ให้สมัครในฐานะร้านค้า เราตรวจสอบทุกร้านก่อนอนุมัติ จึงมีระยะรอสั้น ๆ ระหว่างนี้เข้าสู่ระบบได้ แต่ยังสั่งซื้อไม่ได้',

  'help.q.pending': 'ทำไมบัญชีขึ้นว่าอยู่ระหว่างตรวจสอบ',
  'help.a.pending':
    'ร้านค้าใหม่ทุกร้านมีเจ้าหน้าที่ตรวจสอบก่อนเปิดให้สั่งซื้อ เป็นขั้นตอนเดียวและไม่ใช่ระบบอัตโนมัติ เราจะติดต่อกลับ ระหว่างนี้คุณไม่ต้องทำอะไรเพิ่ม',

  'help.q.minimum': 'ทำไมสั่งซื้อชิ้นเดียวไม่ได้',
  'help.a.minimum':
    'ที่นี่เป็นราคาส่ง แต่ละแบรนด์จึงกำหนดจำนวนแพ็กขั้นต่ำของสินค้าตัวเอง จำนวนขั้นต่ำแสดงอยู่บนสินค้าทุกชิ้น และช่องจำนวนจะไม่ลดต่ำกว่านั้น',

  'help.q.volume': 'ทำไมราคาต่อแพ็กเปลี่ยนเมื่อสั่งเยอะขึ้น',
  'help.a.volume':
    'แบรนด์ตั้งราคาตามจำนวนได้ คือลดราคาต่อแพ็กเมื่อสั่งถึงจำนวนที่กำหนด เมื่อคุณถึงขั้นนั้น ทั้งออร์เดอร์จะได้ราคาที่ถูกลง ไม่ใช่เฉพาะส่วนที่เกิน',

  'help.q.split': 'ทำไมตะกร้าถูกแยกเป็นหลายคำสั่งซื้อ',
  'help.a.split':
    'หนึ่งคำสั่งซื้อต่อหนึ่งแบรนด์ เพราะแต่ละแบรนด์แพ็กและส่งพัสดุของตัวเอง และรับเงินแยกกัน ตะกร้าที่มีสินค้าจาก 3 แบรนด์จึงกลายเป็น 3 คำสั่งซื้อ แต่ละรายการมียอดรวมและค่าจัดส่งของตัวเอง',

  'help.q.pay': 'ชำระเงินอย่างไร',
  'help.a.pay':
    'โอนผ่าน PromptPay เปิดคำสั่งซื้อ สแกน QR แล้วใส่เลขที่คำสั่งซื้อในหมายเหตุการโอน เพราะเราใช้เลขนี้จับคู่การชำระเงินของคุณ จากนั้นอัปโหลดรูปสลิปในหน้าเดียวกัน เราจะตรวจสอบและยืนยันการชำระเงิน แล้วแบรนด์จึงรับออร์เดอร์',

  'help.q.slip': 'โอนแล้วแต่คำสั่งซื้อยังขึ้นว่ารอชำระเงิน',
  'help.a.slip':
    'เป็นเรื่องปกติจนกว่าเราจะตรวจสลิปของคุณ การอัปโหลดสลิปไม่เท่ากับชำระเงินสำเร็จ เพราะมีเจ้าหน้าที่ยืนยันว่าเงินเข้าแล้วจริง หากยังไม่ได้อัปโหลดสลิป กรุณาทำก่อน มิฉะนั้นเราจะจับคู่การโอนของคุณไม่ได้',

  'help.q.delivery': 'ค่าจัดส่งเท่าไหร่',
  'help.a.delivery':
    'คิดต่อคำสั่งซื้อของแต่ละแบรนด์ ตามน้ำหนักพัสดุ: {b1} ไม่เกิน 1 กก., {b2} ไม่เกิน 3 กก., {b3} ไม่เกิน 5 กก., {b4} ไม่เกิน 10 กก., {b5} ไม่เกิน 20 กก. และ {perKg} ต่อกิโลกรัมสำหรับส่วนที่เกิน ส่งฟรีเมื่อคำสั่งซื้อของแบรนด์นั้นเกิน {free} และคำสั่งซื้อแรกของคุณส่งฟรีไม่ว่ายอดเท่าใด',

  'help.q.stages': 'สถานะคำสั่งซื้อแต่ละขั้นหมายถึงอะไร',
  'help.a.stages':
    'รอชำระเงิน จากนั้นได้รับเงินแล้วเมื่อเราตรวจสลิปเรียบร้อย แล้วยืนยันคำสั่งซื้อแล้วเมื่อแบรนด์รับออร์เดอร์ ต่อจากนั้นคือรอเข้ารับพัสดุ กำลังจัดส่ง และจัดส่งแล้ว ขั้นสุดท้ายเป็นของคุณ การยืนยันว่าได้รับสินค้าคือสิ่งที่ปล่อยเงินให้แบรนด์ จึงรบกวนกดยืนยันเมื่อได้รับของ',

  'help.q.returns': 'ขอคืนสินค้าได้ไหม',
  'help.a.returns':
    'ขอคืนได้หลังจากคำสั่งซื้อจัดส่งแล้วเท่านั้น เปิดคำสั่งซื้อนั้นแล้วเริ่มเรื่องคืนสินค้าได้จากในหน้านั้น',

  'help.selling': 'สำหรับแบรนด์ที่ขายสินค้า',

  'help.q.sellerSite': 'ผู้ขายเข้าสู่ระบบที่ไหน',
  'help.a.sellerSite':
    'ที่ศูนย์ผู้ขาย ซึ่งเป็นคนละหน้ากับการเข้าสู่ระบบของร้านค้า หากคุณสมัครเป็นแบรนด์แล้วไปเข้าสู่ระบบที่หน้าร้าน ระบบจะแจ้งและมีลิงก์พาไปหน้าที่ถูกต้อง',

  'help.q.documents': 'ต้องใช้เอกสารอะไรบ้างในการขาย',
  'help.a.documents':
    'ทะเบียน SME หรือบัตรประชาชน พร้อมใบรับรอง อย. เจ้าหน้าที่จะตรวจสอบก่อนเปิดขายสินค้าของคุณ',

  'help.q.commission': 'metoo หักค่าคอมมิชชั่นเท่าไหร่',
  'help.a.commission':
    'ขึ้นกับหมวดสินค้า และลดลงเมื่อแบรนด์มีคำสั่งซื้อมากกว่า {threshold} รายการต่อเดือน: อาหารและเครื่องดื่ม {fb}, สุขภาพและความงาม {hb}, ของใช้ในบ้าน {hl}, แฟชั่นและเครื่องประดับ {fa} อัตรานี้จะถูกบันทึกไว้กับคำสั่งซื้อตั้งแต่ตอนสั่ง การเปลี่ยนอัตราภายหลังจึงไม่กระทบยอดที่คุณได้ไปแล้ว',

  'help.q.payout': 'ได้รับเงินเมื่อไหร่และอย่างไร',
  'help.a.payout':
    'ยอดขายจะเข้ากระเป๋าเงิน metoo ของคุณเมื่อผู้ซื้อยืนยันว่าได้รับสินค้าแล้ว จากนั้นคุณขอถอนเงินจากกระเป๋า และเจ้าหน้าที่จะโอนเข้าบัญชีธนาคารของคุณ',

  'help.q.shippingPayout': 'ค่าจัดส่งถูกหักจากยอดที่ฉันได้รับไหม',
  'help.a.shippingPayout':
    'ไม่ metoo เป็นผู้เก็บค่าจัดส่งและจ่ายค่าขนส่งเอง ค่าคอมมิชชั่นคิดจากค่าสินค้าเท่านั้น ไม่คิดจากค่าจัดส่ง ยอดที่คุณได้รับคือยอดสินค้าหักค่าคอมมิชชั่น',

  'help.account': 'บัญชีผู้ใช้',

  'help.q.twoSites': 'ทำไมมีหน้าเข้าสู่ระบบสองหน้า',
  'help.a.twoSites':
    'ร้านค้าและแบรนด์ใช้คนละเว็บ เพื่อให้แต่ละฝั่งปฏิเสธบัญชีผิดประเภทได้ทันที แทนที่จะให้เข้าไปแล้วติดทุกหน้า หากคุณเข้าผิดหน้า ระบบจะแจ้งและมีลิงก์พาไปหน้าที่ถูกต้อง',

  'help.q.forgotPassword': 'ลืมรหัสผ่าน',
  'help.a.forgotPassword':
    'ตอนนี้ยังไม่มีระบบตั้งรหัสผ่านใหม่ด้วยตัวเอง กรุณาส่งอีเมลหาเราจากอีเมลที่ใช้สมัคร แล้วเราจะช่วยดำเนินการให้',

  'help.q.language': 'ใช้งานเป็นภาษาอังกฤษได้ไหม',
  'help.a.language':
    'ได้ ปุ่มสลับ EN / ไทย อยู่ที่แถบด้านบนของทุกหน้า และระบบจะจำภาษาที่คุณเลือกไว้',

  'help.contactTitle': 'ยังไม่ได้คำตอบ?',
  'help.contactBody': 'ส่งอีเมลหาเรา แล้วเราจะติดต่อกลับโดยเร็ว',
}
