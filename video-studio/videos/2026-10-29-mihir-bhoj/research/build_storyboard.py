"""Storyboard for 2026-10-29-mihir-bhoj (mixed style: B kinetic hook/reveals, C maps, A cinematic story).

One shot list -> animation-studio jobs/<V>/chN.json (Doc art, rendered silent per chapter)
             -> video-studio scenes.json (clip scenes cut from those chapters + map / photo / timeline scenes).
Run from video-studio/:  python3 videos/2026-10-29-mihir-bhoj/research/build_storyboard.py
"""
import json
from pathlib import Path

V = '2026-10-29-mihir-bhoj'
VS = Path(__file__).resolve().parents[3]
AS = VS.parent / 'animation-studio'
END = 638.12
CH = [0, 157.7, 304.0, 469.2, END]  # Doc chapter boundaries (seconds)
I = f'doc/{V}/'

rows = []  # (t, 'doc', shot) or (t, 'vs', scene)


def D(t, img, **kw):
    rows.append((t, 'doc', {'img': I + img + '.png', **kw}))


def CARD(t, text, **kw):
    rows.append((t, 'doc', {'kind': 'card', 'text': text, **kw}))


def TITLE(t, text, sub=None, **kw):
    rows.append((t, 'doc', {'kind': 'title', 'text': text, **({'sub': sub} if sub else {}), **kw}))


def S(t, scene):
    rows.append((t, 'vs', {'t': t, **scene}))


def DJ(t, file, **kw):  # doc shot from a real picture copied into public/doc/<V>/ (jpg)
    rows.append((t, 'doc', {'img': I + file, **kw}))


def CLIP(t, name, sfx=None):  # rendered insert (proof page / war map) from assets/<name>.mp4
    S(t, {'type': 'clip', 'clip': f'{name}.mp4', 'from': 0, 'zoom': 1.0, 'quiet': True, **({'sfx': sfx} if sfx else {})})


def PH(t, img, label, line, **kw):  # real photo with caption + credit
    S(t, {'type': 'photo', 'img': img + '.jpg', 'move': kw.pop('move', 'in'), 'cap': [label, line, round(t + 0.3, 2)], 'credit': CR[img], **kw})


def WAR(t, name, clashes=(), gallops=()):  # war map + battle sounds at its clash / charge seconds
    fx = [[round(t + c + k * 0.45, 2), f'sword{k % 3 + 1}', -12] for c in clashes for k in range(3)]
    fx += [[round(t + g, 2), 'gallop_short', -14] for g in gallops]
    CLIP(t, name, sorted(fx))


SIL = {'grade': 'none'}
CR = {
    'kannauj_ghat': 'Photo: Utkarsh Nandan Oreya / Wikimedia Commons · CC BY-SA 4.0',
    'teli_mandir': 'Photo: Suyash Dwivedi / Wikimedia Commons · CC BY-SA 4.0',
    'bateshwar': 'Photo: Suyash Dwivedi / Wikimedia Commons · CC BY-SA 4.0',
    'gwalior_1844': 'Picture: unknown artist, 1844 / Wikimedia Commons · Public domain',
    'pratihara_vishnu': 'Photo: Manishontop02 / Wikimedia Commons · CC BY-SA 4.0',
    'pratihara_relief': 'Photo: Manishontop02 / Wikimedia Commons · CC BY-SA 4.0',
    'varaha_udayagiri': 'Photo: Arian Zwegers / Wikimedia Commons · CC BY 2.0',
    'kannauj_kartikeya': 'Photo: Utkarsh Nandan Oreya / Wikimedia Commons · CC BY-SA 4.0',
    'gwalior_fort': 'Photo: Suyash Dwivedi / Wikimedia Commons · CC BY-SA 4.0',
    'yarmouk_hayton': 'Picture: Catalan illustrator, early 14th c. (BnF) / Wikimedia Commons · Public domain',
    'coin_heraclius': 'Photo: The Met / Wikimedia Commons · CC0',
    'qadisiyyah_folio': 'Picture: Shahnameh folio, Iran 1494 · Aga Khan Museum / Wikimedia Commons · Public domain',
    'coin_yazdegerd': 'Photo: Classical Numismatic Group / Wikimedia Commons · CC BY-SA 3.0',
    'gibraltar': 'Photo: Acediscovery / Wikimedia Commons · CC BY 4.0',
    'guadalete': 'Painting: Mariano Barbasán / Wikimedia Commons · Public domain',
    'banbhore': 'Photo: Anwar Ahmed / Wikimedia Commons · CC BY-SA 3.0',
    'pala_vishnu': 'Photo: SpeakingArch / Wikimedia Commons · CC BY-SA 4.0',
    'ellora_kailasa': 'Photo: Ms Sarah Welch / Wikimedia Commons · CC BY-SA 4.0',
    'coin_pratihara': 'Photo: SpeakingArch / Wikimedia Commons · CC BY-SA 4.0',
    'varaha_pratihara': 'Photo: unknown author / Wikimedia Commons · CC BY-SA 3.0',
}
KANNAUJ = (79.92, 27.05)

# ---------------- HOOK: social media -> history (B kinetic) ----------------
D(0, 'modern_p1', punch=True, fx=['flicker'], grade='cold', slam={'text': 'Social media', 'sub': 'image banane mein time nahi lagta', 'at': 0.5})
D(4.7, 'modern_p2', **{'in': 'flash'}, punch=True, slam={'text': 'Viral video', 'at': 0.1}, shake=[4.8])
D(6.6, 'modern_p2', z=[1.35, 1.5], focus=[30, 40], slam={'text': 'Controversy', 'at': 0.1, 'color': '#ff9a5a'}, shake=[6.7])
D(8.6, 'modern_p1', **{'in': 'flash'}, z=[1.4, 1.55], focus=[70, 35], grade='cold', slam={'text': 'Ek label', 'sub': 'poori community par', 'at': 1.3}, shake=[9.9])
D(12.8, 'modern_p2', move='left')
D(15.0, 'modern_p2', **{'in': 'flash'}, z=[1.3, 1.45], focus=[65, 50], slam={'text': 'Property politics', 'at': 0.4}, shake=[15.4])
D(17.6, 'modern_p1', **{'in': 'flash'}, z=[1.2, 1.3], grade='cold', slam={'text': 'Rent · Dominance', 'at': 0.3})
D(21.5, 'modern_p1', **{'in': 'flash'}, z=[1.5, 1.7], focus=[62, 40], grade='cold', slam={'text': 'Memes', 'sub': 'limited narratives', 'at': 0.3}, shake=[21.8])
D(27.4, 'modern_p3', **{'in': 'black'}, move='push', fx=['dust', 'rays'])
D(32.3, 'modern_p3', z=[1.3, 1.45], focus=[40, 55], fx=['dust'])
D(37.7, 'modern_p4', **{'in': 'fade'}, move='up', fx=['dust'])
DJ(43.1, 'photo_teli.jpg', **{'in': 'fade'}, grade='none', move='push', fx=['dust'], label={'text': 'Teli ka Mandir, Gwalior', 'sub': 'Pratihara daur'})
D(47.9, 'kannauj_p1', **{'in': 'flash'}, punch=True, slam={'text': 'Scale badal jata hai', 'at': 0.3}, shake=[48.2])
TITLE(50.1, 'Gurjar-Pratihara', 'DYNASTY · 8th–11th CENTURY')
S(52.6, {'type': 'map', 'cam': [[52.6, 0, 76, 24, 0.9], [52.8, 3.2, 79, 25, 1.2]],
         'focus': ['IND'], 'pins': [['Kannauj', KANNAUJ[0], KANNAUJ[1], 53.6, 1, 1.2, 'Pratihara capital']],
         'rings': [[KANNAUJ[0], KANNAUJ[1], 54.0, 1.2, 'red']],
         'caps': [['North India', 'Politics mein <b>major role</b>', 52.9]]})
D(56.2, 'sil_nagabhata_p3', **SIL, punch=True, fx=['embers'], slam={'text': 'Arab campaigns', 'sub': 'ke khilaf resistance', 'at': 0.4}, shake=[56.6])
D(59.8, 'court_p1', **{'in': 'flash'}, move='push', fx=['dust'])
D(64.2, 'modern_p1', **{'in': 'fade'}, grade='cold', move='pull')
D(66.2, 'sil_empire_p4', **{'in': 'flash'}, **SIL, punch=True, slam={'text': '1000+ saal purani', 'sub': 'historical politics', 'at': 0.2})
D(68.2, 'travellers_p3', **{'in': 'fade'}, move='left', fx=['dust'])
DJ(71.8, 'page_ei101.jpg', **{'in': 'fade'}, grade='none', z=[1.9, 2.1], focus=[45, 15], label={'text': 'Epigraphia Indica', 'sub': 'Gwalior Prasasti of Bhoja'})
D(73.7, 'portraits_p1', **{'in': 'flash'}, punch=True, fx=['dust'], slam={'text': 'Samrat Mihir Bhoj', 'at': 1.6, 'color': '#ffd27a'}, shake=[75.3])
# ---------------- INTRO: who was Mihir Bhoj (A + B reveals) ----------------
D(78.2, 'mb_style1_graphicnovel', **{'in': 'black'}, move='push', fx=['dust'])
D(80.5, 'travellers_p2', **{'in': 'fade'}, move='left', fx=['dust'], label={'text': 'Arab travellers', 'sub': '9th century'})
S(82.7, {'type': 'map', 'cam': [[82.7, 0, 74, 25, 0.9], [83.0, 3.0, 79, 26, 1.2]], 'focus': ['IND'],
         'pins': [['Kannauj', KANNAUJ[0], KANNAUJ[1], 83.3, 1, 1.2, 'capital']],
         'rings': [[KANNAUJ[0], KANNAUJ[1], 84.5, 1.2, 'red']],
         'caps': [['Kannauj se North India tak', 'Empire ka <b>influence</b>', 83.4]]})
CLIP(88.5, 'p_sulaiman_a')
D(91.0, 'sil_empire_p4', **{'in': 'flash'}, **SIL, punch=True, slam={'text': 'Islam ka sabse bada dushman', 'sub': '9th century ka Arab account', 'at': 0.1, 'color': '#ff9a5a'}, shake=[91.2])
TITLE(93.9, 'Mihir Bhoj', 'GURJAR SAMRAT', **{'in': 'black'})
CLIP(96.7, 'p_wiki_mihir')
CLIP(99.8, 'p_wiki_pratihara')
D(108.2, 'kannauj_p1', **{'in': 'fade'}, move='right')
PH(111.1, 'pala_vishnu', 'Palas · Bengal–Bihar', 'Pala school ki <b>Vishnu murti</b>', pos='center 30%')
PH(112.9, 'ellora_kailasa', 'Rashtrakutas · Deccan', 'Kailasa mandir, <b>Ellora</b>')
D(114.7, 'court_p2', **{'in': 'black'}, move='push', fx=['smoke'], label={'text': 'Mihir Bhoj', 'sub': 'c. 836 CE · Pratihara samrat'})
D(118.2, 'legacy_p2', move='left', fx=['dust'])
D(121.9, 'court_p3', **{'in': 'fade'}, move='push', fx=['dust'])
D(125.4, 'kannauj_p4', move='push')
D(128.2, 'court_p4', **{'in': 'fade'}, move='push', fx=['flicker'])
D(133.6, 'legacy_p4', **{'in': 'fade'}, move='pull', slam={'text': '~50 saal ka reign', 'sub': 'c. 836 – 885 CE', 'at': 0.8})
D(139.3, 'portraits_p1', **{'in': 'flash'}, z=[1.3, 1.4], focus=[40, 35])
D(141.5, 'sil_empire_p4', **{'in': 'flash'}, **SIL, punch=True, slam={'text': 'Military power', 'at': 0.1})
D(143.0, 'kannauj_p1', **{'in': 'flash'}, punch=True, slam={'text': 'Empire ka scale', 'at': 0.1})
DJ(144.6, 'coin_varaha.jpg', **{'in': 'flash'}, punch=True, grade='none', slam={'text': 'Adivaraha', 'at': 0.1, 'color': '#ffd27a'})
DJ(146.2, 'page_sulaiman.jpg', **{'in': 'flash'}, punch=True, grade='none', z=[1.6, 1.7], focus=[50, 52], slam={'text': 'Arab accounts', 'at': 0.1})
D(148.4, 'legacy_p1', **{'in': 'flash'}, punch=True, slam={'text': 'Achievements', 'at': 0.3})
D(151.5, 'legacy_p4', **{'in': 'fade'}, move='push')
# ---------------- CH1: Arab expansion (C maps + silhouettes) ----------------
S(157.7, {'type': 'map', 'cam': [[157.7, 0, 30, 34, 1.0], [158.0, 5.0, 22, 35, 0.8]],
          'tags': [['MIDDLE EAST', 44, 30, 158.5, 0.8], ['NORTH AFRICA', 8, 27, 159.6, 0.8], ['EUROPE', 12, 47, 160.4, 0.8]],
          'big': [['7th Century', 157.8, 160.2]], 'caps': [['7th Century', 'Duniya ka <b>political map</b> badal raha tha', 161.0]]})
D(164.0, 'sil_sindh_p3', **SIL, move='push', fx=['smoke'], slam={'text': 'Nayi power', 'at': 0.3, 'color': '#ffd27a'})
PH(166.4, 'yarmouk_hayton', 'Arab armies', 'Ek ke baad ek <b>kingdoms</b> se jung', pos='center 60%')
PH(168.8, 'coin_heraclius', 'Byzantine Empire', 'Heraclius ka sone ka <b>solidus</b>')
S(171.3, {'type': 'map', 'cam': [[171.3, 0, 40, 27, 1.6], [173.8, 3.5, 38, 30, 1.15]],
          'light': [['SAU', 171.6, 'gold']],
          'pins': [['Medina', 39.61, 24.47, 171.7, 1, 1.6, '632 CE']],
          'routes': [[39.61, 24.47, 36.29, 33.51, 175.0, 1.2, 40], [39.61, 24.47, 44.58, 33.09, 175.5, 1.2, 40], [39.61, 24.47, 29.92, 31.2, 176.0, 1.4, -40]],
          'caps': [['632 CE', 'Arab Caliphates ka <b>expansion</b>', 171.6]]})
WAR(178.7, 'war_yarmouk', clashes=[1.6, 2.4], gallops=[0.0])
S(183.2, {'type': 'map', 'cam': [[183.2, 0, 37, 32, 1.9], [186.4, 2.0, 33, 29, 1.5]],
          'light': [['SYR', 183.3, 'red'], ['ISR', 183.3, 'red'], ['PSX', 183.3, 'red'], ['JOR', 183.3, 'red'], ['LBN', 183.3, 'red'], ['EGY', 187.0, 'red']],
          'pins': [['Alexandria', 29.92, 31.2, 187.2, -1, 1.5, '642 CE']],
          'caps': [['Syria · Palestine', '<b>Arab control</b>', 183.4, 186.5], ['639–642 CE', 'Egypt bhi <b>conquer</b>', 186.8]]})
PH(190.8, 'qadisiyyah_folio', 'Sasanian Persian Empire', 'Shahnameh (1494) mein <b>Qadisiyyah</b> ka chitran', pos='center 62%')
WAR(194.4, 'war_qadisiyyah', clashes=[1.6, 3.2], gallops=[1.4])
PH(202.1, 'coin_yazdegerd', '651 CE', 'Aakhri Sasanian shah <b>Yazdegerd III</b> ka sikka')
S(205.8, {'type': 'map', 'cam': [[205.8, 0, 30, 31, 1.2], [206.2, 6.5, 2, 32, 1.4]],
          'light': [['LBY', 210.2, 'red'], ['TUN', 210.9, 'red'], ['DZA', 211.6, 'red'], ['MAR', 213.2, 'red']],
          'routes': [[29.9, 31.2, 13.2, 32.9, 208.2, 1.4, 30], [13.2, 32.9, 3.0, 36.7, 209.7, 1.2, 20], [3.0, 36.7, -5.8, 35.8, 211.0, 1.2, 20]],
          'big': [['Expansion ruki nahi', 205.9, 207.9]],
          'caps': [['North Africa', 'Libya · Tunisia · Algeria · <b>Morocco</b>', 210.2]]})
PH(217.1, 'gibraltar', '711 CE · Tariq ibn Ziyad', 'Gibraltar ka naam <b>Jabal Tariq</b> se')
S(220.8, {'type': 'map', 'cam': [[220.8, 0, -5, 36.5, 2.2], [221.0, 4.0, -4.5, 39, 1.6]],
          'pins': [['Gibraltar', -5.35, 36.14, 221.0, 1, 2.2, '711 CE']],
          'routes': [[-5.8, 35.8, -4.0, 38.5, 221.2, 2.0, 30]],
          'light': [['ESP', 223.2, 'red'], ['PRT', 223.2, 'red']],
          'caps': [['Strait of Gibraltar', 'Paar karke <b>Iberia</b> mein', 221.0, 224.5], ['Iberian Peninsula', 'Aaj ka <b>Spain · Portugal</b>', 224.7]]})
PH(228.5, 'guadalete', 'Visigothic kingdom ki haar · 711', 'Painting: <b>Guadalete</b> ki ladai (19th century)')
S(233.1, {'type': 'map', 'cam': [[233.1, 0, 55, 33, 1.0], [233.4, 3.0, 62, 36, 1.2], [235.9, 4.0, 68, 27, 1.7]],
          'light': [['TKM', 233.6, 'red'], ['UZB', 233.8, 'red'], ['AFG', 234.0, 'red'], ['IND', 236.4, 'gold'], ['PAK', 236.4, 'gold']],
          'tags': [['CENTRAL ASIA', 63, 41, 233.5, 1.2]],
          'rings': [[68.4, 25.4, 237.8, 1.7, 'red']],
          'caps': [['Central Asia', 'aur <b>India ka western frontier</b>', 233.7]]})
PH(241.4, 'banbhore', 'Banbhore · Sindh', 'Kai historians ise <b>Debal</b> maante hain')
WAR(245.6, 'war_sindh', clashes=[1.8], gallops=[0.0])
S(253.5, {'type': 'map', 'cam': [[253.5, 0, 69, 25, 1.4], [254.0, 4.0, 72, 23, 1.8]],
          'focus': ['IND'],
          'routes': [[68.4, 25.4, 71.5, 22.6, 254.2, 1.4, 20], [68.4, 25.4, 69.8, 23.3, 254.6, 1.2, -10], [68.4, 25.4, 75.8, 23.2, 255.2, 1.8, 30]],
          'rings': [[71.5, 22.6, 258.8, 1.8, 'red'], [70.3, 21.9, 259.6, 1.8, 'red'], [70.0, 23.4, 261.6, 1.8, 'red'], [75.8, 23.2, 262.8, 1.8, 'red']],
          'tags': [['SINDH', 68.0, 26.2, 253.7, 1.4], ['GUJARAT', 72.6, 23.5, 258.6, 1.8], ['SAURASHTRA', 70.6, 21.5, 259.5, 1.8], ['KUTCH', 69.6, 23.6, 261.8, 1.8], ['MALWA', 76.0, 23.7, 262.8, 1.8]],
          'caps': [['Arab governors', 'Sindh se <b>aage</b> ki nazar', 253.8, 257.4], ['8th century', 'Western India mein <b>Arab campaigns</b>', 257.6]]})
WAR(264.7, 'war_west', clashes=[3.0], gallops=[0.0])
# ---------------- CH2: Nagabhata I ----------------
D(271.2, 'portraits_p2', **{'in': 'black'}, move='push', fx=['dust'], label={'text': 'Nagabhata I', 'sub': 'Gurjara-Pratihara · 8th century', 'at': 0.3})
CLIP(273.4, 'p_wiki_nagabhata')
S(281.0, {'type': 'photo', 'img': 'gwalior_1844.jpg', 'move': 'in', 'cap': ['Gwalior', 'Mihir Bhoj ke reign ka <b>Gwalior inscription</b>', 281.3], 'credit': CR['gwalior_1844']})
CLIP(284.4, 'p_ei101')
CLIP(289.4, 'p_ei103a')
WAR(296.0, 'war_nagabhata', clashes=[3.6], gallops=[1.2])
CLIP(304.1, 'p_ei103b')
PH(308.9, 'teli_mandir', 'Teli ka Mandir · Gwalior Fort', 'Pratihara daur ki <b>virasat</b>')
D(313.8, 'portraits_p1', **{'in': 'black'}, z=[1.05, 1.2], focus=[45, 35], fx=['dust'])
D(318.9, 'travellers_p2', **{'in': 'fade'}, move='right')
CLIP(322.9, 'p_sulaiman_c')
TITLE(326.1, 'Mihir Bhoj', 'GURJAR SAMRAT', **{'in': 'black'})
D(329.3, 'mb_style1_graphicnovel', move='push', fx=['dust'])
D(333.8, 'sil_empire_p4', **SIL, **{'in': 'flash'}, punch=True, fx=['dust'], slam={'text': 'Cavalry', 'sub': 'reputation door tak', 'at': 0.3})
CLIP(336.2, 'p_sulaiman_b')
D(342.7, 'mb_style1_graphicnovel', **{'in': 'black'}, z=[1.2, 1.05], move='pull')
# ---------------- CH3: Mihir Bhoj's reign ----------------
D(348.8, 'portraits_p2', **{'in': 'fade'}, move='push', label={'text': 'Nagabhata I', 'sub': 'Foundation'})
PH(352.4, 'bateshwar', 'Bateshwar mandir · Morena', 'Pratihara daur <b>(8th–10th century)</b>')
D(356.2, 'portraits_p1', **{'in': 'flash'}, punch=True, fx=['dust'])
D(359.7, 'court_p1', **{'in': 'fade'}, move='push', slam={'text': '~50 saal', 'sub': 'c. 836 – 885 CE', 'at': 0.4, 'color': '#ffd27a'})
PH(365.1, 'kannauj_kartikeya', 'Kannauj Museum', 'Kartikeya · <b>10th century</b>', pos='center 30%')
D(368.3, 'kannauj_p1', **{'in': 'fade'}, move='right')
D(371.7, 'legacy_p2', move='push', fx=['dust'])
D(378.6, 'court_p1', **{'in': 'black'}, grade='night', z=[1.2, 1.35], focus=[50, 40], fx=['flicker'], label={'text': 'Ramabhadra', 'sub': 'Mihir Bhoj ke pita'})
D(381.7, 'sil_empire_p1', **SIL, move='push', fx=['smoke'])
D(384.2, 'court_p2', **{'in': 'fade'}, move='push', fx=['smoke'])
S(389.3, {'type': 'map', 'cam': [[389.3, 0, 77, 25, 1.2], [389.6, 4.0, 76, 25.5, 1.6]], 'focus': ['IND'],
          'rings': [[79.5, 25.0, 391.5, 1.6, 'red'], [72.8, 25.6, 394.0, 1.6, 'red']],
          'tags': [['BUNDELKHAND', 79.5, 24.4, 391.6, 1.6], ['GURJARATRA', 73.2, 26.4, 394.2, 1.6]],
          'caps': [['Early reign', 'Pratihara authority <b>revive</b>', 390.0]]})
S(401.0, {'type': 'timeline', 'bg': 'teli_mandir.jpg', 'label': 'Copper plate records', 'head': ['Mihir Bhoj ke <b>documents</b>', 401.2],
          'events': [['836 CE', 'Barah copper plate', 403.0, True], ['843 CE', 'Daulatpura plate', 415.5], ['c. 885 CE', 'Reign ka ant', 419.0]]})
D(423.0, 'legacy_p3', **{'in': 'fade'}, move='push', fx=['dust'])
PH(427.7, 'pratihara_vishnu', 'Chanderi museum', 'Prachin <b>Vishnu murti</b>', pos='center 68%')
PH(431.8, 'gwalior_fort', 'Gwalior Fort', 'Pratihara daur ka <b>Gwalior</b>')
D(435.9, 'legacy_p2', move='right', fx=['dust'])
PH(441.1, 'pratihara_relief', 'Chanderi museum', 'Surasundari <b>relief panel</b>', pos='center 60%')
D(443.8, 'court_p1', move='pull', fx=['dust'])
D(447.5, 'legacy_p1', **{'in': 'flash'}, punch=True, slam={'text': 'Major imperial force', 'at': 2.5})
D(454.2, 'kannauj_p1', **{'in': 'black'}, move='push', label={'text': 'Kannauj', 'sub': 'Pratihara capital'})
D(456.6, 'kannauj_p2', move='left', fx=['dust'], slam={'text': 'Political supremacy', 'sub': 'ka centre', 'at': 0.6})
S(459.5, {'type': 'photo', 'img': 'kannauj_ghat.jpg', 'move': 'in', 'cap': ['Kannauj · aaj', 'Ganga plains mein <b>influence</b>', 459.8], 'credit': CR['kannauj_ghat']})
D(462.8, 'kannauj_p3', **{'in': 'fade'}, move='right')
D(466.0, 'rivals_p3', move='push', fx=['flicker'])
D(469.2, 'kannauj_p4', **{'in': 'fade'}, move='push')
S(475.4, {'type': 'map', 'cam': [[475.4, 0, 79, 24, 1.5], [475.7, 4.0, 77, 26, 1.9], [480.6, 2.5, 73, 29, 1.9], [484.2, 3.0, 78, 25, 1.4]], 'focus': ['IND'],
          'rings': [[80.5, 27.0, 476.0, 1.9, 'gold'], [74.0, 26.5, 476.8, 1.9, 'gold'], [78.0, 23.5, 477.6, 1.9, 'gold'], [75.0, 30.5, 481.0, 1.9, 'gold']],
          'tags': [['UTTAR PRADESH', 80.5, 27.4, 476.0, 1.9], ['RAJASTHAN', 73.6, 26.6, 476.8, 1.9], ['MADHYA PRADESH', 78.0, 23.3, 477.6, 1.9], ['NORTH-WEST', 75.0, 31.0, 481.0, 1.9]],
          'caps': [['Influence', 'Aaj ke UP · Rajasthan · <b>MP</b>', 475.8, 484.1], ['Note', 'Boundaries <b>badalti rahi</b> · map approximate', 484.3]]})
D(491.5, 'sil_empire_p4', **SIL, **{'in': 'black'}, move='push', fx=['dust'])
D(498.0, 'court_p3', move='left')
D(501.4, 'rivals_p1', **{'in': 'flash'}, punch=True, label={'text': 'Palas', 'sub': 'Bengal–Bihar'})
D(503.0, 'rivals_p2', **{'in': 'flash'}, punch=True, label={'text': 'Rashtrakutas', 'sub': 'Deccan'})
CLIP(506.6, 'p_wiki_tripartite')
PH(515.5, 'pala_vishnu', 'Pala dynasty · Bengal–Bihar', 'Pala school ki <b>Vishnu murti</b>', pos='center 30%')
PH(519.1, 'ellora_kailasa', 'Rashtrakutas · Deccan', 'Kailasa mandir, <b>Ellora</b>')
S(522.0, {'type': 'map', 'cam': [[522.0, 0, 80, 23, 1.4], [522.3, 4.0, 80, 23, 1.6]], 'focus': ['IND'],
          'pins': [['Pala', 86.0, 25.3, 522.3, 1, 1.6, 'Bengal–Bihar'], ['Rashtrakuta', 77.2, 17.2, 522.8, 1, 1.6, 'Deccan'], ['Kannauj', KANNAUJ[0], KANNAUJ[1], 523.3, -1, 1.6, 'Pratihara']],
          'rings': [[86.0, 25.3, 522.4, 1.6, 'blue'], [77.2, 17.2, 522.9, 1.6, 'red'], [KANNAUJ[0], KANNAUJ[1], 523.4, 1.6, 'gold']],
          'routes': [[86.0, 25.3, KANNAUJ[0], KANNAUJ[1], 527.0, 1.3, 20, 'blue'], [77.2, 17.2, KANNAUJ[0], KANNAUJ[1], 527.6, 1.3, -30, 'red']],
          'caps': [['Teen badi powers', 'Kannauj ke liye <b>long conflict</b>', 526.8]]})
D(534.8, 'sil_empire_p3', **SIL, **{'in': 'flash'}, punch=True, fx=['embers'], slam={'text': 'Tripartite Struggle', 'at': 0.3, 'color': '#ffd27a'}, shake=[535.1])
D(537.3, 'mb_style1_graphicnovel', **{'in': 'black'}, move='push', fx=['dust'])
D(540.2, 'travellers_p2', **{'in': 'fade'}, move='left')
CLIP(543.3, 'p_sulaiman_full')
S(558.7, {'type': 'map', 'cam': [[558.7, 0, 62, 24, 1.1], [559.0, 4.0, 66, 24, 1.3]],
          'pins': [['Siraf', 52.6, 27.7, 559.2, -1, 1.3, 'Arab port'], ['Gurjara', KANNAUJ[0], KANNAUJ[1], 561.0, 1, 1.3, 'Juzr']],
          'routes': [[52.6, 27.7, 72.6, 21.0, 559.6, 2.0, -30], [72.6, 21.0, KANNAUJ[0], KANNAUJ[1], 561.2, 1.2, 20]],
          'caps': [['Reputation', 'India ke <b>bahar bhi</b> known', 563.3]]})
WAR(567.9, 'war_cavalry', clashes=[9.6, 11.4], gallops=[3.0, 6.0])
D(582.4, 'horses_coins_p1', **{'in': 'black'}, move='push', fx=['rays', 'dust'])
CLIP(585.6, 'p_ei184')
D(595.1, 'horses_coins_p1', **{'in': 'fade'}, z=[1.3, 1.4], focus=[35, 45])
D(600.8, 'travellers_p3', **{'in': 'fade'}, move='right', fx=['dust'])
DJ(604.1, 'page_ei184.jpg', **{'in': 'flash'}, grade='none', z=[2.4, 2.6], focus=[48, 73], slam={'text': 'Trade', 'at': 0.2})
DJ(606.3, 'page_ei101.jpg', **{'in': 'flash'}, grade='none', z=[2.4, 2.6], focus=[42, 14], slam={'text': 'Inscriptions', 'at': 0.2})
DJ(608.5, 'page_sulaiman.jpg', **{'in': 'flash'}, grade='none', z=[1.6, 1.75], focus=[50, 52], slam={'text': 'External accounts', 'at': 0.3})
D(612.7, 'portraits_p4', **{'in': 'black'}, move='push', fx=['smoke', 'flicker'])
D(616.9, 'portraits_p4', **{'in': 'flash'}, z=[1.3, 1.45], focus=[65, 40], slam={'text': 'Adivaraha', 'at': 0.1, 'color': '#ffd27a'}, shake=[617.0])
S(617.9, {'type': 'photo', 'img': 'varaha_udayagiri.jpg', 'move': 'in', 'pos': 'center 22%', 'cap': ['Varaha · Udayagiri caves', 'Vishnu ka <b>boar avatar</b>', 618.2], 'credit': CR['varaha_udayagiri']})
PH(622.0, 'varaha_pratihara', 'Pratihara coin · 850–900 CE', 'Sikke par <b>Varaha</b>')
PH(625.0, 'coin_pratihara', 'National Museum, Delhi', 'Pratihara-kaal ka <b>chandi ka sikka</b>')
D(629.0, 'legacy_p3', **{'in': 'fade'}, move='left')
D(632.1, 'legacy_p4', **{'in': 'fade'}, move='pull', slam={'text': 'Titles · Symbols · Authority', 'at': 0.6})

# ---------------- write ----------------
rows.sort(key=lambda r: r[0])
specs = [[] for _ in range(len(CH) - 1)]
scenes = []
cur_clip = None


def chapter(t):
    for i in range(len(CH) - 1):
        if CH[i] <= t < CH[i + 1]:
            return i
    return len(CH) - 2


for k, (t, kind, x) in enumerate(rows):
    nxt = rows[k + 1][0] if k + 1 < len(rows) else END
    if kind == 'vs':
        scenes.append(x)
        cur_clip = None
        continue
    # doc shot: may cross a chapter boundary -> split
    a = t
    while a < nxt - 1e-6:
        ci = chapter(a)
        b = min(nxt, CH[ci + 1])
        shot = dict(x, t=round(a - CH[ci], 2))
        if 'shake' in shot:
            shot['shake'] = [round(s - CH[ci], 2) for s in shot['shake']]
        if a != t:  # continuation piece: plain cut, no repeated slam/flash
            shot.pop('slam', None); shot.pop('in', None); shot.pop('punch', None); shot.pop('label', None)
        specs[ci].append(shot)
        if cur_clip != ci:
            scenes.append({'t': round(a, 2), 'type': 'clip', 'clip': f'mb_ch{ci + 1}.mp4', 'from': round(a - CH[ci], 2), 'zoom': 1.0, 'quiet': True})
            cur_clip = ci
        a = b

# a doc shot right after a map/photo starts a new clip; mark which chapters have content
for ci, shots in enumerate(specs):
    length = round(CH[ci + 1] - CH[ci], 2)
    # cover video-studio stretches with a cheap black card so the chapter stays one continuous file
    spec = {'end': length, 'grade': 'warm', 'shots': []}
    filled = sorted(shots, key=lambda s: s['t'])
    if not filled or filled[0]['t'] > 0:
        spec['shots'].append({'t': 0, 'kind': 'card', 'text': ''})
    spec['shots'] += filled
    (AS / 'jobs' / V / f'ch{ci + 1}.json').write_text(json.dumps(spec, indent=1, ensure_ascii=False))

# black filler during vs scenes: the next doc shot after a vs scene begins at its own t, so insert a blank card at each vs start
for s in scenes:
    if not s.get('clip', '').startswith('mb_ch'):  # maps, photos, proof pages, war maps
        ci = chapter(s['t'])
        p = AS / 'jobs' / V / f'ch{ci + 1}.json'
        spec = json.loads(p.read_text())
        spec['shots'].append({'t': round(s['t'] - CH[ci], 2), 'kind': 'card', 'text': ''})
        spec['shots'].sort(key=lambda z: (z['t'], z.get('text') != ''))
        uniq = {}
        for z in spec['shots']:  # one shot per start second; a real shot beats an empty filler card
            if z['t'] not in uniq or uniq[z['t']].get('text') == '':
                uniq[z['t']] = z
        shots = [z for z in uniq.values() if z['t'] < spec['end'] - 0.05]
        # a shot shorter than 0.5 s breaks Doc's fades: drop it (an empty filler loses to the shot after it)
        spec['shots'] = [z for k, z in enumerate(shots) if k + 1 == len(shots) or shots[k + 1]['t'] - z['t'] >= 0.5 or z.get('text') != '']
        p.write_text(json.dumps(spec, indent=1, ensure_ascii=False))

# sound accents on the kinetic hits (video-studio mixes all sound)
sfx = {}
for t, kind, x in rows:
    if kind != 'doc':
        continue
    if x.get('in') == 'flash':
        sfx.setdefault(t, []).append([t, 'whoosh', -10])
    if 'slam' in x:
        at = t + x['slam'].get('at', 0)
        sfx.setdefault(t, []).append([round(at, 2), 'hit', -6])
for s in scenes:
    if s.get('clip', '').startswith('mb_ch'):
        end = next((z['t'] for z in scenes if z['t'] > s['t']), END)
        cues = [c for tt, cs in sfx.items() if s['t'] <= tt < end for c in cs]
        if cues:
            s['sfx'] = sorted(cues)

sp = VS / 'videos' / V / 'scenes.json'
d = json.loads(sp.read_text())
d['scenes'] = scenes
d['map'] = 'caliphate_india'
d['music'] = [
    {'file': 'library/music/Crypto.mp3', 'from': 0, 'to': 78.2, 'below_voice_db': 11},
    {'file': 'library/music/Interloper.mp3', 'from': 78.2, 'to': 157.7, 'below_voice_db': 12},
    {'file': 'library/music/Decline.mp3', 'from': 157.7, 'to': 304.0, 'below_voice_db': 12},
    {'file': 'library/music/Long_Note_Two.mp3', 'from': 304.0, 'to': 491.5, 'below_voice_db': 13},
    {'file': 'library/music/Stay_the_Course.mp3', 'from': 491.5, 'to': END, 'below_voice_db': 12},
]
d.pop('parts', None)  # low-memory single render (parts=3 ran out of RAM, 30 Oct)
sp.write_text(json.dumps(d, indent=1, ensure_ascii=False))
print(len(scenes), 'scenes;', [len(s) for s in specs], 'doc shots per chapter')
