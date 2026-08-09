/**
 * Thailand's 77 provinces, Thai and English.
 *
 * Extracted from the team's `thailand-province.csv`, which is a GIS export —
 * the original carries map geometry per province and runs to 7.7 MB. Only the
 * names and the ADM1 code are kept, because a dropdown needs nothing else and
 * shipping a megabyte of polygons to a browser to fill a select would be
 * absurd.
 *
 * Sorted by the Thai name, which is the order a Thai reader scans for.
 *
 * NOTE: this file is provinces ONLY. The source has no districts or
 * sub-districts, so เขต/อำเภอ and แขวง/ตำบล remain free text until a
 * tambon-level dataset exists.
 */
export interface Province {
  /** ADM1 code, e.g. TH10 for Bangkok. Stable across name spellings. */
  code: string
  th: string
  en: string
}

export const PROVINCES: readonly Province[] = [
  { code: 'TH81', th: 'กระบี่', en: 'Krabi' },
  { code: 'TH10', th: 'กรุงเทพมหานคร', en: 'Bangkok' },
  { code: 'TH71', th: 'กาญจนบุรี', en: 'Kanchanaburi' },
  { code: 'TH46', th: 'กาฬสินธุ์', en: 'Kalasin' },
  { code: 'TH62', th: 'กำแพงเพชร', en: 'Kamphaeng Phet' },
  { code: 'TH40', th: 'ขอนแก่น', en: 'Khon Kaen' },
  { code: 'TH22', th: 'จันทบุรี', en: 'Chanthaburi' },
  { code: 'TH24', th: 'ฉะเชิงเทรา', en: 'Chachoengsao' },
  { code: 'TH20', th: 'ชลบุรี', en: 'Chon Buri' },
  { code: 'TH18', th: 'ชัยนาท', en: 'Chai Nat' },
  { code: 'TH36', th: 'ชัยภูมิ', en: 'Chaiyaphum' },
  { code: 'TH86', th: 'ชุมพร', en: 'Chumphon' },
  { code: 'TH92', th: 'ตรัง', en: 'Trang' },
  { code: 'TH23', th: 'ตราด', en: 'Trat' },
  { code: 'TH63', th: 'ตาก', en: 'Tak' },
  { code: 'TH26', th: 'นครนายก', en: 'Nakhon Nayok' },
  { code: 'TH73', th: 'นครปฐม', en: 'Nakhon Pathom' },
  { code: 'TH48', th: 'นครพนม', en: 'Nakhon Phanom' },
  { code: 'TH30', th: 'นครราชสีมา', en: 'Nakhon Ratchasima' },
  { code: 'TH80', th: 'นครศรีธรรมราช', en: 'Nakhon Si Thammarat' },
  { code: 'TH60', th: 'นครสวรรค์', en: 'Nakhon Sawan' },
  { code: 'TH12', th: 'นนทบุรี', en: 'Nonthaburi' },
  { code: 'TH96', th: 'นราธิวาส', en: 'Narathiwat' },
  { code: 'TH55', th: 'น่าน', en: 'Nan' },
  { code: 'TH38', th: 'บึงกาฬ', en: 'Bueng Kan' },
  { code: 'TH31', th: 'บุรีรัมย์', en: 'Buri Ram' },
  { code: 'TH13', th: 'ปทุมธานี', en: 'Pathum Thani' },
  { code: 'TH77', th: 'ประจวบคีรีขันธ์', en: 'Prachuap Khiri Khan' },
  { code: 'TH25', th: 'ปราจีนบุรี', en: 'Prachin Buri' },
  { code: 'TH94', th: 'ปัตตานี', en: 'Pattani' },
  { code: 'TH14', th: 'พระนครศรีอยุธยา', en: 'Phra Nakhon Si Ayutthaya' },
  { code: 'TH56', th: 'พะเยา', en: 'Phayao' },
  { code: 'TH82', th: 'พังงา', en: 'Phangnga' },
  { code: 'TH93', th: 'พัทลุง', en: 'Phatthalung' },
  { code: 'TH66', th: 'พิจิตร', en: 'Phichit' },
  { code: 'TH65', th: 'พิษณุโลก', en: 'Phitsanulok' },
  { code: 'TH83', th: 'ภูเก็ต', en: 'Phuket' },
  { code: 'TH44', th: 'มหาสารคาม', en: 'Maha Sarakham' },
  { code: 'TH49', th: 'มุกดาหาร', en: 'Mukdahan' },
  { code: 'TH95', th: 'ยะลา', en: 'Yala' },
  { code: 'TH35', th: 'ยโสธร', en: 'Yasothon' },
  { code: 'TH85', th: 'ระนอง', en: 'Ranong' },
  { code: 'TH21', th: 'ระยอง', en: 'Rayong' },
  { code: 'TH70', th: 'ราชบุรี', en: 'Ratchaburi' },
  { code: 'TH45', th: 'ร้อยเอ็ด', en: 'Roi Et' },
  { code: 'TH16', th: 'ลพบุรี', en: 'Lop Buri' },
  { code: 'TH52', th: 'ลำปาง', en: 'Lampang' },
  { code: 'TH51', th: 'ลำพูน', en: 'Lamphun' },
  { code: 'TH33', th: 'ศรีสะเกษ', en: 'Si Sa Ket' },
  { code: 'TH47', th: 'สกลนคร', en: 'Sakon Nakhon' },
  { code: 'TH90', th: 'สงขลา', en: 'Songkhla' },
  { code: 'TH91', th: 'สตูล', en: 'Satun' },
  { code: 'TH11', th: 'สมุทรปราการ', en: 'Samut Prakan' },
  { code: 'TH75', th: 'สมุทรสงคราม', en: 'Samut Songkhram' },
  { code: 'TH74', th: 'สมุทรสาคร', en: 'Samut Sakhon' },
  { code: 'TH19', th: 'สระบุรี', en: 'Saraburi' },
  { code: 'TH27', th: 'สระแก้ว', en: 'Sa Kaeo' },
  { code: 'TH17', th: 'สิงห์บุรี', en: 'Sing Buri' },
  { code: 'TH72', th: 'สุพรรณบุรี', en: 'Suphan Buri' },
  { code: 'TH84', th: 'สุราษฎร์ธานี', en: 'Surat Thani' },
  { code: 'TH32', th: 'สุรินทร์', en: 'Surin' },
  { code: 'TH64', th: 'สุโขทัย', en: 'Sukhothai' },
  { code: 'TH43', th: 'หนองคาย', en: 'Nong Khai' },
  { code: 'TH39', th: 'หนองบัวลำภู', en: 'Nong Bua Lam Phu' },
  { code: 'TH37', th: 'อำนาจเจริญ', en: 'Amnat Charoen' },
  { code: 'TH41', th: 'อุดรธานี', en: 'Udon Thani' },
  { code: 'TH53', th: 'อุตรดิตถ์', en: 'Uttaradit' },
  { code: 'TH61', th: 'อุทัยธานี', en: 'Uthai Thani' },
  { code: 'TH34', th: 'อุบลราชธานี', en: 'Ubon Ratchathani' },
  { code: 'TH15', th: 'อ่างทอง', en: 'Ang Thong' },
  { code: 'TH57', th: 'เชียงราย', en: 'Chiang Rai' },
  { code: 'TH50', th: 'เชียงใหม่', en: 'Chiang Mai' },
  { code: 'TH76', th: 'เพชรบุรี', en: 'Phetchaburi' },
  { code: 'TH67', th: 'เพชรบูรณ์', en: 'Phetchabun' },
  { code: 'TH42', th: 'เลย', en: 'Loei' },
  { code: 'TH54', th: 'แพร่', en: 'Phrae' },
  { code: 'TH58', th: 'แม่ฮ่องสอน', en: 'Mae Hong Son' },
]

/** Is this the name of a real province? Matched on either language. */
export function isProvince(name: string): boolean {
  const trimmed = name.trim()
  return PROVINCES.some((p) => p.th === trimmed || p.en === trimmed)
}
