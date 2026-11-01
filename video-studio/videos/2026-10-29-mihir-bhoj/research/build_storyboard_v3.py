"""Storyboard v3 for 2026-10-29-mihir-bhoj (after the 31 Oct review: audio fixed, no repeated pictures, motion everywhere).

Shots are written in seconds of the OLD narration (narration_v2) because that is what the transcript and the review
were made on; T() converts every time to the edited narration (narration_v3) through the raw-recording cut maps.
Writes, for animation-studio:
  jobs/<V>/v3/hook.json            Hook (motion graphics: feed, stamp, ticker, memes, glitch, docs, rewind)
  jobs/<V>/v3/maps/<name>.json     HistMap shots (animated historical territory, arrows, pins)
  jobs/<V>/v3/ch1..4.json          Doc art chapters (every keyframe once, parallax layers)
  video-studio V/proofs.json       framed documents, framed photos, kinetic text cards
and V/scenes.json (clip scenes + timeline). War maps (assets/war_*.mp4) are reused as rendered.
Run from video-studio/:  python3 videos/2026-10-29-mihir-bhoj/research/build_storyboard_v3.py
"""
import json
from pathlib import Path

V = '2026-10-29-mihir-bhoj'
VS = Path(__file__).resolve().parents[3]
AS = VS.parent / 'animation-studio'
VD = VS / 'videos' / V
AE = VD / 'audio-edit'
A2 = json.loads((AE / 'narration_v2_raw_cuts.json').read_text())
A3 = json.loads((AE / 'narration_v3_raw_cuts.json').read_text())
END = round(A3[-1]['out_at'] + A3[-1]['to'] - A3[-1]['from'] + 0.6, 2)


def T(t):
    """old narration second -> new narration second (a time inside a removed stretch goes to the next kept word)."""
    for c in A2:
        d = c['to'] - c['from']
        if c['out_at'] - 0.01 <= t <= c['out_at'] + d + 0.01:
            part, r = c['part'], c['from'] + t - c['out_at']
            break
    else:
        nxt = min((c for c in A2 if c['out_at'] > t), key=lambda c: c['out_at'], default=None)
        if nxt is None:
            return END
        part, r = nxt['part'], nxt['from']
    for c in A3:
        if c['part'] == part and c['from'] - 0.01 <= r <= c['to'] + 0.01:
            return round(c['out_at'] + r - c['from'], 2)
    later = [c for c in A3 if c['part'] == part and c['from'] > r]
    if later:
        return round(min(later, key=lambda c: c['from'])['out_at'], 2)
    # part fully passed: first piece of the next part in order
    order = [c['part'] for c in A3]
    return round(next(c['out_at'] for c in A3 if order.index(c['part']) > order.index(part)), 2)


I = f'doc/{V}/'
IMG = AS / 'public' / 'doc' / V / 'v2'
rows = []  # (t_old, kind, payload)
USED = set()


def once(key):
    assert key not in USED, f'picture used twice: {key}'
    USED.add(key)


def ART(t, name, **kw):
    """ChatGPT keyframe, whole picture (camera move + light fx)."""
    once(name)
    bg, fg = IMG / f'{name}_bg.jpg', IMG / f'{name}_fg.png'
    # no cut-out parallax: automatic cut-outs split people at the waist when the layers moved (user, 31 Oct)
    shot = {'img': I + f'v2/{name}.png'}
    kw.setdefault('fx', ['dust'])
    rows.append((t, 'doc', {**shot, **kw}))


def TITLE(t, text, sub=None, **kw):
    rows.append((t, 'doc', {'kind': 'title', 'text': text, **({'sub': sub} if sub else {}), **kw}))


def CLIP(t, name, sfx=None):
    rows.append((t, 'vs', {'type': 'clip', 'clip': f'{name}.mp4', 'from': 0, 'zoom': 1.0, 'quiet': True, **({'sfx': sfx} if sfx else {})}))


def WAR(t, name, clashes=(), gallops=()):
    once(name)
    t3 = T(t)
    fx = [[round(t3 + c + k * 0.45, 2), f'sword{k % 3 + 1}', -12] for c in clashes for k in range(3)]
    fx += [[round(t3 + g, 2), 'gallop_short', -14] for g in gallops]
    CLIP(t, name, sorted(fx))


PROOFS = json.loads((VD / 'proofs.json').read_text())['shots'] if (VD / 'proofs.json').exists() else {}
NEWPROOFS = {}


def PROOF(t, name, spec, sfx=None):
    """framed document / framed photo / kinetic card; duration filled in later from the next shot."""
    NEWPROOFS[name] = spec
    CLIP(t, name, sfx)


CR = {}
for ph in json.loads((VD / 'research' / 'sources.json').read_text())['photos']:
    CR[Path(ph['file']).stem] = f"Photo: {ph['author'] or 'unknown author'} / Wikimedia Commons · {ph['licence']}"
SIZE = {}


def size(img):
    if img not in SIZE:
        import subprocess
        w, h = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(VD / 'assets' / img)],
                              capture_output=True, text=True).stdout.strip().split(',')[:2]
        SIZE[img] = (int(w), int(h))
    return SIZE[img]


def PHOTO(t, stem, label, line, cam=None, marks=None, credit=None):
    """real photo in a frame on the desk, slow camera, caption, credit (never full screen)."""
    once(stem)
    img = stem + '.jpg'
    w, h = size(img)
    PROOF(t, f'x_{stem}', {'kind': 'doc', 'img': img, 'w': w, 'h': h, 'cam': cam or [[0, 50, 50, 0.92], [0.6, 50, 48, 1.05]],
                           'marks': marks or [], 'cap': [label, line], 'credit': credit or CR.get(stem, '')})


def KIN(t, name, lines, stamp=None, sfx=None):
    """kinetic text card (no picture)."""
    PROOF(t, name, {'kind': 'kinetic', 'lines': lines, **({'stamp': stamp} if stamp else {})}, sfx)


MAPS = {}


def MAP(t, name, spec):
    """HistMap shot; every time inside `spec` is an OLD-narration second and is converted here."""
    once(name)
    MAPS[name] = (t, spec)
    CLIP(t, name)


KANNAUJ = [79.92, 27.05]
GOLD, GREEN, PALA, RASH = '#e0a43a', '#3f9d5c', '#4f7fd0', '#c0504d'
# approximate shapes (lon, lat); every map says "Borders approximate"
P_ARABIA = [[34.9,29.5],[36.5,27],[39,22],[42,16.5],[43.3,12.7],[46,13.3],[49,14.5],[52,16.5],[55.5,17.5],[58,20.5],[59.8,22.5],[57,24],[56.4,26.2],[54,24.2],[51.5,24.3],[50.6,25.6],[49.5,27],[48.5,28.5],[47.7,29.5],[46.5,29.2],[44.5,29.2],[42,31],[39,32],[37,31.5],[35.5,31]]
P_SYRIA = [[34.3,31.3],[35.5,31],[37,31.5],[39,32],[41,34.5],[42.5,37],[40,37.2],[36.6,36.8],[35.9,35.4],[35.6,33.6],[34.9,32.3]]
P_IRAQ = [[39,32],[42,31],[44.5,29.2],[46.5,29.2],[47.7,29.5],[48.6,30],[48,31.5],[46,33.5],[46,35.5],[44.5,37.1],[42.5,37],[41,34.5]]
P_EGYPT = [[25,31.6],[29.9,31.3],[32.3,31.3],[34.3,31.3],[34.9,29.5],[33.5,27.5],[35.8,23.5],[32,22],[25,22]]
P_PERSIA = [[46,33.5],[48,31.5],[48.6,30],[50,29.5],[51.5,27.8],[54,26.6],[57,25.6],[61.5,25.2],[62.5,28],[61,31],[61.5,35.5],[60,36.8],[56,38],[53.8,37],[50,37.3],[48.5,38.5],[46,38.9],[44.5,37.1],[46,35.5]]
P_NAFRICA = [[25,31.6],[20,30.8],[19,30.3],[15.5,31.5],[11,33.3],[10.5,36.9],[9,37.2],[3,36.8],[-2,35.1],[-5.4,35.9],[-6.5,34.5],[-9.6,30.4],[-9,29],[-3,29.5],[5,30],[10,30],[15,28],[20,28],[25,29]]
P_IBERIA = [[-9.3,42.8],[-8.8,37],[-6,36.2],[-5.4,36.1],[-2,36.7],[0,38.7],[0.5,40.5],[3.2,41.9],[3,42.5],[-1.8,43.2],[-5,43.3],[-7.5,43.5]]
P_TRANSOX = [[56,38],[60,36.8],[61.5,35.5],[65,37.3],[69,37.2],[71,39.5],[70,41.5],[66,43],[62,43],[58,42],[55,41]]
P_SINDH = [[66.6,25.4],[67.5,24],[68.5,23.7],[70.5,24.4],[71.1,26.5],[70,28],[71.5,30],[70.5,30.5],[69,29],[67.5,27.5],[67.2,26]]
P_BYZ = [[26,41.5],[29,41.2],[33,42],[36,41.5],[41,41],[42.5,37],[40,37.2],[36.6,36.8],[35.9,35.4],[35.6,33.6],[34.9,32.3],[34.3,31.3],[32.3,31.3],[29.9,31.3],[25,31.6],[25,29],[30,28],[32,24],[30,22.5],[33.5,24],[34.9,29.5],[35.5,31],[36.5,33],[36.2,36],[32,36.5],[28,36.5],[26.5,38.5]]
P_SASANIAN = [[39,32],[42,31],[44.5,29.2],[47.7,29.5],[50,29.5],[54,26.6],[57,25.6],[61.5,25.2],[62.5,28],[61,31],[63,35],[61.5,37.5],[56,38.5],[53.8,37],[50,37.3],[47,39],[44,40],[42.5,37],[41,34.5]]
P_PRATIHARA_CORE = [[73,24.5],[75,23],[77.5,23.5],[79.5,24.5],[81,26],[80.5,27.5],[78.5,28.2],[76,27.8],[74,26.5]]
P_PRATIHARA_PEAK = [[70.5,24.5],[72,23],[74,22.5],[77,22],[80,22.6],[82.5,23.5],[84.5,24.5],[86,25.5],[85.5,27],[83.5,27.5],[81,28.5],[79,30],[77,31],[75.5,31.2],[74,30.5],[72.5,28.8],[71,27]]
P_BUNDEL = [[78,24],[80.5,24],[81,25.5],[79.5,26.2],[78.2,25.5]]
P_GURJARATRA = [[72,25],[74,25],[74.5,27],[73,27.8],[71.8,26.5]]
P_PALA = [[84.5,24.5],[86,25.5],[85.5,27],[88,26.5],[89.5,26],[90,24],[89,22],[87,21.6],[86,23]]
P_RASH = [[73,21.8],[74,22.5],[77,22],[80,22.6],[81,20],[80.5,17],[79,14.5],[76,13],[74,15],[73.2,17],[72.8,19.5]]

# ======================= HOOK (motion graphics, real material) =======================
HOOK_END = 47.5
HOOK = [  # serious documentary tone (31 Oct: the playful feed/memes/glitch hook was rejected)
    (0.0, {'kind': 'art', 'img': 'modern_1.jpg', 'lines': ['Social media ke daur mein', 'image banane mein time nahi lagta']}),
    (4.6, {'kind': 'thumbs', 'lines': ['Ek viral video'], 'views': [40000, 3800000], 'flash': True}),
    (5.8, {'kind': 'art', 'img': 'modern_2.jpg', 'lines': ['Ek controversy', 'ya kisi ek individual ka incident'], 'flash': True}),
    (10.5, {'kind': 'words', 'lines': ['Poori community par <span style="color:#d9574a">ek label</span>'], 'flash': True}),
    (12.5, {'kind': 'headlines', 'items': ['NCR property politics', 'Rent', 'Local dominance']}),
    (21.4, {'kind': 'thumbs', 'lines': ['Memes', 'limited narratives'], 'flash': True}),
    (27.0, {'kind': 'words', 'lines': ['Present day image', 'aur poori historical journey · ek cheez nahi'], 'flash': True}),
    (31.9, {'kind': 'art', 'img': 'modern_3.jpg', 'lines': ['Memes nahi', 'history se pehchaan']}),
    (36.6, {'kind': 'docs', 'imgs': ['doc_ei18_title.jpg', 'doc_elliot1_title.jpg'], 'labels': ['Epigraphia Indica · 1925', 'Elliot & Dowson · 1867']}),
    (38.0, {'kind': 'art', 'img': 'modern_4.jpg', 'lines': ['Ek naam', 'jise aaj local politics mein suna jata hai'], 'flash': True}),
    (42.8, {'kind': 'rewind', 'from': 2026, 'to': 750, 'imgs': ['osian_1897.jpg', 'chaturbhuj_gwalior.jpg', 'osian_monuments.jpg', 'osian_varaha.jpg'], 'text': 'Early medieval India', 'flash': True}),
]
for k in ('osian_1897', 'chaturbhuj_gwalior', 'osian_monuments', 'osian_varaha', 'doc_ei18_title', 'doc_elliot1_title', 'modern_1', 'modern_2', 'modern_3', 'modern_4'):
    once(k)
CLIP(0.0, 'hook_v3', [[T(t) + 0.02, 'whoosh', -14] for t, b in HOOK if b.get('flash')])

MAP(HOOK_END, 'm_scale', {'cam': [[HOOK_END, 79, 26, 3.2], [HOOK_END + 2.4, 62, 30, 1.25]], 'note': ' ',
                          'lands': [{'at': HOOK_END + 0.2, 'dur': 1.6, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ}],
                          'pins': [{'ll': KANNAUJ, 'at': HOOK_END, 'label': 'Kannauj'}],
                          'caps': [['Yahin se', 'kahani ka <b>scale</b> badal jata hai', HOOK_END + 0.3]]})
ART(50.1, 'v2_a01_fort_dawn', **{'in': 'flash'}, slam={'text': 'Gurjar-Pratihara', 'sub': 'dynasty · 8th–11th century', 'at': 0.2, 'color': '#ffd27a'})
MAP(52.6, 'm_northindia', {'cam': [[52.6, 78, 25, 1.9], [56.2, 78.5, 25.5, 2.2]], 'title': {'text': 'Gurjara-Pratihara', 'sub': 'North India'},
                           'lands': [{'at': 52.7, 'dur': 2.0, 'color': GOLD, 'pts': P_PRATIHARA_CORE, 'origin': KANNAUJ}],
                           'pins': [{'ll': KANNAUJ, 'at': 53.0, 'label': 'Kannauj', 'sub': 'Pratihara capital'}, {'ll': [78.17, 26.22], 'at': 53.6, 'label': 'Gwalior', 'side': -1}],
                           'caps': [['North India', 'Politics mein <b>major role</b>', 53.0]]})
ART(56.2, 'v2_a02_cav_charge', **{'in': 'flash'}, punch=True, fx=['dust'], slam={'text': 'Arab campaigns', 'sub': 'ke khilaf resistance', 'at': 0.4}, shake=[56.6])
ART(59.8, 'v2_a03_throne', **{'in': 'fade'}, move='push', fx=['flicker'])
KIN(64.2, 'k_1000', [{'text': 'AAJ KE STEREOTYPES', 'at': 0.1, 'size': 80}, {'text': '1000+ SAAL', 'at': 1.0, 'size': 170, 'c': 'gold', 'hit': True}, {'text': 'purani historical politics', 'at': 1.8, 'size': 60}],
    sfx=[[T(64.2) + 1.0, 'hit', -6]])
ART(68.2, 'v2_a29_copper_plate', **{'in': 'fade'}, move='push', fx=['dust', 'flicker'], label={'text': 'Historical records', 'sub': 'copper plates · inscriptions'})
ART(73.7, 'v2_a04_portrait', **{'in': 'flash'}, punch=True, fx=['dust'], slam={'text': 'Samrat Mihir Bhoj', 'at': 1.6, 'color': '#ffd27a'}, shake=[75.3])
# ======================= INTRO =======================
ART(78.2, 'v2_a05_traveller_ship', **{'in': 'black'}, move='left', fx=['dust'], label={'text': 'Arab travellers', 'sub': '9th century'})
MAP(82.7, 'm_kannauj', {'cam': [[82.7, 79.5, 26.5, 2.4], [88.5, 78.5, 26, 1.7]],
                        'lands': [{'at': 83.0, 'dur': 4.0, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ}],
                        'arrows': [{'at': 83.4, 'dur': 1.4, 'pts': [KANNAUJ, [77, 29], [75, 30.5]], 'color': '#fff3d6', 'width': 10},
                                   {'at': 83.8, 'dur': 1.4, 'pts': [KANNAUJ, [76, 25], [73, 24.5]], 'color': '#fff3d6', 'width': 10},
                                   {'at': 84.2, 'dur': 1.4, 'pts': [KANNAUJ, [83, 26.5], [85, 25.5]], 'color': '#fff3d6', 'width': 10}],
                        'pins': [{'ll': KANNAUJ, 'at': 82.8, 'label': 'Kannauj', 'sub': 'capital'}],
                        'caps': [['Kannauj se North India tak', 'Empire ka <b>influence</b>', 83.2]]})
KIN(88.5, 'k_dushman', [{'text': '9th century ke Arab accounts', 'at': 0.1, 'size': 64}, {'text': 'ISLAM KA', 'at': 1.4, 'size': 130, 'hit': True},
                        {'text': 'SABSE BADA DUSHMAN', 'at': 2.1, 'size': 130, 'c': 'red', 'hit': True}],
    stamp={'text': 'SULAIMAN · c. 851', 'at': 3.4, 'c': 'gold'}, sfx=[[T(88.5) + 1.4, 'hit', -6], [T(88.5) + 2.1, 'hit', -6]])
TITLE(93.9, 'Mihir Bhoj', 'GURJAR SAMRAT', **{'in': 'black'})
CLIP(96.7, 'p_wiki_mihir')
CLIP(99.8, 'p_wiki_pratihara')
ART(108.2, 'v2_a20_army_parade', **{'in': 'fade'}, move='right')
ART(111.1, 'v2_a10_rival_banners', **{'in': 'flash'}, punch=True, label={'text': 'Palas · Rashtrakutas', 'sub': 'bade empires ko chunauti'})
ART(114.7, 'v2_a07_coronation', **{'in': 'black'}, move='push', fx=['dust', 'flicker'], label={'text': 'Mihir Bhoj', 'sub': 'c. 836 CE · Pratihara samrat'})
ART(118.2, 'v2_a08_frontier_night', move='left', fx=['flicker'], grade='night')
ART(121.9, 'v2_a09_war_tent', **{'in': 'fade'}, move='push', fx=['flicker'])
ART(125.4, 'v2_a34_kannauj_gate', move='up', fx=['dust'])
ART(128.2, 'v2_x04_council', **{'in': 'fade'}, move='push', fx=['flicker'])
ART(133.6, 'v2_a11_older_king', **{'in': 'fade'}, move='pull', slam={'text': '~50 saal ka reign', 'sub': 'c. 836 – 885 CE', 'at': 0.8})
ART(139.3, 'v2_x03_gate_ride', **{'in': 'flash'}, move='push', fx=['dust'])
ART(141.5, 'v2_a12_cav_squadron', **{'in': 'flash'}, punch=True, move='left', slam={'text': 'Military power', 'at': 0.1})
MAP(143.0, 'm_scale2', {'cam': [[143.0, 80, 25, 2.6], [144.6, 78, 25.5, 1.6]], 'note': ' ',
                        'lands': [{'at': 143.0, 'dur': 1.2, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ}],
                        'caps': [['Empire ka scale', 'Kannauj se <b>North India</b> tak', 143.1]]})
ART(144.6, 'v2_a50_mint', **{'in': 'flash'}, punch=True, slam={'text': 'Adivaraha', 'at': 0.1, 'color': '#ffd27a'})
ART(146.2, 'v2_a13_merchant_lamp', **{'in': 'flash'}, punch=True, grade='night', slam={'text': 'Arab accounts', 'at': 0.1})
ART(148.4, 'v2_a14_victory_gate', **{'in': 'flash'}, punch=True, slam={'text': 'Achievements', 'at': 0.3})
ART(151.5, 'v2_x06_regal', **{'in': 'fade'}, move='push', fx=['dust', 'rays'])
# ======================= CH1: Arab expansion =======================
MAP(157.7, 'm_world7', {'cam': [[157.7, 30, 34, 1.2], [164.0, 38, 33, 1.05]], 'title': {'text': '7th century', 'sub': 'Duniya ka political map'},
                        'lands': [{'at': 158.4, 'dur': 2.0, 'color': '#8a5fb5', 'pts': P_BYZ, 'origin': [29, 41], 'label': 'Byzantine Empire', 'labelAt': [33, 39]},
                                  {'at': 159.4, 'dur': 2.0, 'color': '#c98a3a', 'pts': P_SASANIAN, 'origin': [52, 33], 'label': 'Sasanian Empire', 'labelAt': [53, 32.5]}],
                        'tags': [{'text': 'Europe', 'll': [12, 45], 'at': 158.0}, {'text': 'North Africa', 'll': [8, 28], 'at': 158.2}, {'text': 'Arabia', 'll': [45, 23], 'at': 161.0}],
                        'caps': [['7th century', 'Duniya ka <b>political map</b> badal raha tha', 161.0]]})
ART(164.0, 'v2_a16_desert_camp', grade='night', move='push', fx=['embers'], slam={'text': 'Nayi power', 'at': 0.3, 'color': '#ffd27a'})
PHOTO(166.4, 'yarmouk_hayton', 'Arab armies', 'Ek ke baad ek <b>kingdoms</b> se jung', cam=[[0, 50, 50, 0.95], [0.5, 55, 55, 1.25]])
PHOTO(168.8, 'coin_heraclius', 'Byzantine Empire', 'Heraclius ka sone ka <b>solidus</b>', marks=[{'k': 'circle', 'r': [12, 8, 76, 84], 'at': 0.8, 'c': 'gold'}])
MAP(171.3, 'm_arab632', {'cam': [[171.3, 41, 26, 1.9], [178.7, 41, 28, 1.6]], 'year': {'from': 632, 'to': 636, 'at': 171.4, 'dur': 7},
                         'lands': [{'at': 171.6, 'dur': 2.4, 'color': GREEN, 'pts': P_ARABIA, 'origin': [39.6, 24.5], 'label': 'Arabia', 'labelAt': [45, 23]}],
                         'arrows': [{'at': 174.6, 'dur': 1.6, 'pts': [[39.6, 24.5], [37.5, 28.5], [36.2, 32.8]], 'color': '#e9f5ec', 'width': 12, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'},
                                    {'at': 175.2, 'dur': 1.6, 'pts': [[39.6, 24.5], [42, 29], [44.4, 32.3]], 'color': '#e9f5ec', 'width': 12}],
                         'pins': [{'ll': [39.61, 24.47], 'at': 171.6, 'label': 'Medina', 'sub': '632 CE'}],
                         'caps': [['632 CE', 'Arab Caliphates ka <b>expansion</b>', 171.6]]})
WAR(178.7, 'war_yarmouk', clashes=[1.6, 2.4], gallops=[0.0])
MAP(183.2, 'm_levant', {'cam': [[183.2, 37, 31.5, 2.2], [190.8, 34, 29.5, 1.7]], 'year': {'from': 636, 'to': 642, 'at': 183.3, 'dur': 7},
                        'lands': [{'at': 183.3, 'dur': 0.1, 'color': GREEN, 'pts': P_ARABIA, 'origin': [39.6, 24.5]},
                                  {'at': 183.4, 'dur': 2.2, 'color': GREEN, 'pts': P_SYRIA, 'origin': [36, 32.8], 'label': 'Syria · Palestine', 'labelAt': [38.3, 34.8]},
                                  {'at': 186.8, 'dur': 2.6, 'color': GREEN, 'pts': P_EGYPT, 'origin': [32.6, 30.8], 'label': 'Egypt', 'labelAt': [30.5, 26.5]}],
                        'arrows': [{'at': 186.6, 'dur': 1.8, 'pts': [[34.6, 31], [32.4, 30.6], [29.9, 31.1]], 'color': '#e9f5ec', 'width': 12, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'}],
                        'pins': [{'ll': [29.92, 31.2], 'at': 188.4, 'label': 'Alexandria', 'sub': '642 CE', 'side': -1}],
                        'caps': [['Syria · Palestine', '<b>Arab control</b>', 183.4, 186.5], ['639–642 CE', 'Egypt bhi <b>conquer</b>', 186.8]]})
PHOTO(190.8, 'qadisiyyah_folio', 'Sasanian Persian Empire', 'Shahnameh (1494) mein <b>Qadisiyyah</b> ka chitran', cam=[[0, 50, 50, 0.9], [0.6, 50, 62, 1.5]])
WAR(194.4, 'war_qadisiyyah', clashes=[1.6, 3.2], gallops=[1.4])
PHOTO(202.1, 'coin_yazdegerd', '651 CE', 'Aakhri Sasanian shah <b>Yazdegerd III</b> ka sikka', marks=[{'k': 'circle', 'r': [3, 4, 46, 92], 'at': 0.8, 'c': 'gold', 'note': 'Yazdegerd III', 'side': 'below'}])
MAP(205.8, 'm_nafrica', {'cam': [[205.8, 25, 31, 1.6], [213.0, 5, 32, 1.45], [217.1, 0, 33, 1.5]], 'year': {'from': 647, 'to': 709, 'at': 206.0, 'dur': 9},
                         'lands': [{'at': 205.9, 'dur': 0.1, 'color': GREEN, 'pts': P_EGYPT, 'origin': [30, 29]},
                                   {'at': 208.0, 'dur': 6.0, 'color': GREEN, 'pts': P_NAFRICA, 'origin': [25, 30.5], 'label': 'North Africa', 'labelAt': [4, 31.5]}],
                         'arrows': [{'at': 208.2, 'dur': 4.6, 'pts': [[29.9, 31.2], [13.2, 32.9], [3.0, 36.7], [-5.8, 35.8]], 'color': '#e9f5ec', 'width': 12, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'}],
                         'tags': [{'text': 'Libya', 'll': [17, 28.5], 'at': 210.2}, {'text': 'Tunisia', 'll': [9.5, 33.8], 'at': 210.9}, {'text': 'Algeria', 'll': [3, 30], 'at': 211.6}, {'text': 'Morocco', 'll': [-6.5, 31.5], 'at': 213.2}],
                         'caps': [['Expansion ruki nahi', 'North Africa · <b>Morocco tak</b>', 206.0]]})
PHOTO(217.1, 'gibraltar', '711 CE · Tariq ibn Ziyad', 'Gibraltar ka naam <b>Jabal Tariq</b> se')
MAP(220.8, 'm_iberia', {'cam': [[220.8, -5.4, 36.2, 3.4], [224.6, -4, 39.5, 2.2]], 'year': {'from': 711, 'to': 718, 'at': 221.0, 'dur': 6},
                        'lands': [{'at': 220.9, 'dur': 0.1, 'color': GREEN, 'pts': P_NAFRICA, 'origin': [-5, 34]},
                                  {'at': 222.2, 'dur': 4.5, 'color': GREEN, 'pts': P_IBERIA, 'origin': [-5.4, 36.2], 'label': 'Iberia', 'labelAt': [-4, 40]}],
                        'arrows': [{'at': 221.0, 'dur': 1.4, 'pts': [[-5.6, 35.6], [-5.4, 36.0], [-5.6, 36.6]], 'color': '#e9f5ec', 'width': 12, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_inf.png'}],
                        'pins': [{'ll': [-5.35, 36.14], 'at': 221.0, 'label': 'Gibraltar', 'sub': '711 CE'}],
                        'caps': [['Strait of Gibraltar', 'Paar karke <b>Iberia</b> mein', 221.0, 224.5], ['Iberian Peninsula', 'Aaj ka <b>Spain · Portugal</b>', 224.7]]})
PHOTO(228.5, 'guadalete', 'Visigothic kingdom ki haar · 711', 'Painting: <b>Guadalete</b> ki ladai (19th century)', cam=[[0, 50, 50, 0.95], [0.6, 45, 55, 1.2]])
MAP(233.1, 'm_centralasia', {'cam': [[233.1, 58, 34, 1.6], [236.0, 63, 33, 1.5], [241.4, 67, 28, 1.9]],
                             'lands': [{'at': 233.1, 'dur': 0.1, 'color': GREEN, 'pts': P_PERSIA, 'origin': [52, 33]},
                                       {'at': 233.6, 'dur': 2.5, 'color': GREEN, 'pts': P_TRANSOX, 'origin': [61.5, 36], 'label': 'Central Asia', 'labelAt': [64, 40]}],
                             'arrows': [{'at': 236.4, 'dur': 2.2, 'pts': [[58, 30], [63, 27], [67.5, 25.3]], 'color': '#e9f5ec', 'width': 12, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'}],
                             'tags': [{'text': 'Indian subcontinent', 'll': [76, 22], 'at': 236.4}],
                             'caps': [['Central Asia', 'aur <b>India ka western frontier</b>', 233.7]]})
PHOTO(241.4, 'banbhore', 'Banbhore · Sindh', 'Kai historians ise <b>Debal</b> maante hain')
WAR(245.6, 'war_sindh', clashes=[1.8], gallops=[0.0])
MAP(253.5, 'm_west', {'cam': [[253.5, 69, 25.5, 2.4], [257.5, 71.5, 23.5, 2.6], [264.7, 72.5, 23.5, 2.4]],
                      'lands': [{'at': 253.6, 'dur': 1.8, 'color': GREEN, 'pts': P_SINDH, 'origin': [68.4, 25.4], 'label': 'Sindh', 'labelAt': [68.6, 26.8]}],
                      'arrows': [{'at': 257.8, 'dur': 1.6, 'pts': [[68.6, 25], [70, 23.6], [71.5, 22.6]], 'color': '#e9f5ec', 'width': 10, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'},
                                 {'at': 258.6, 'dur': 1.4, 'pts': [[68.6, 25], [69.6, 23.6]], 'color': '#e9f5ec', 'width': 10},
                                 {'at': 259.6, 'dur': 1.6, 'pts': [[68.6, 25], [70.3, 22.4], [70.3, 21.6]], 'color': '#e9f5ec', 'width': 10},
                                 {'at': 261.6, 'dur': 2.0, 'pts': [[69.5, 25.5], [73, 24.6], [75.8, 23.4]], 'color': '#e9f5ec', 'width': 10, 'token': 'doc/2026-10-29-mihir-bhoj/war/arab_cav.png'}],
                      'tags': [{'text': 'Gujarat', 'll': [72.6, 23.5], 'at': 258.6}, {'text': 'Saurashtra', 'll': [70.6, 21.5], 'at': 259.5}, {'text': 'Kutch', 'll': [69.6, 23.6], 'at': 261.0}, {'text': 'Malwa', 'll': [76.0, 23.7], 'at': 262.8}],
                      'caps': [['Arab governors', 'Sindh se <b>aage</b> ki nazar', 253.8, 257.4], ['8th century', 'Western India mein <b>Arab campaigns</b>', 257.6]]})
WAR(264.7, 'war_west', clashes=[3.0], gallops=[0.0])
# ======================= CH2: Nagabhata I =======================
ART(271.45, 'v2_a17_nagabhata', **{'in': 'black'}, move='push', fx=['dust'], label={'text': 'Nagabhata I', 'sub': 'Gurjara-Pratihara · 8th century', 'at': 0.3})
CLIP(273.4, 'p_wiki_nagabhata')
PHOTO(281.0, 'gwalior_1844', 'Gwalior', 'Mihir Bhoj ke reign ka <b>Gwalior inscription</b>', cam=[[0, 50, 50, 0.95], [0.6, 50, 45, 1.15]])
CLIP(284.4, 'p_ei101')
CLIP(289.4, 'p_ei103a')
WAR(296.0, 'war_nagabhata', clashes=[3.6], gallops=[1.2])
ART(304.1, 'v2_a22_nagabhata_flag', **{'in': 'fade'}, move='push', fx=['dust'], label={'text': 'Pratihara dynasty ka uday', 'sub': 'Nagabhata ka resistance'})
PHOTO(308.9, 'teli_mandir', 'Teli ka Mandir · Gwalior Fort', 'Pratihara daur ki <b>virasat</b>', cam=[[0, 50, 50, 0.95], [0.6, 50, 45, 1.2]])
ART(315.85, 'v2_a18_rising_king', **{'in': 'black'}, move='push', fx=['rays'])
ART(321.12, 'v2_x07_scribes', **{'in': 'fade'}, move='left', fx=['flicker'], label={'text': 'Indian records + Arab accounts'})
TITLE(326.1, 'Mihir Bhoj', 'GURJAR SAMRAT', **{'in': 'black'})
ART(329.3, 'v2_x02_balcony', move='push', fx=['flicker'])
ART(333.8, 'v2_a21_cav_sunset', **{'in': 'flash'}, punch=True, fx=['dust'], slam={'text': 'Cavalry', 'sub': 'reputation door tak', 'at': 0.3})
KIN(336.2, 'k_scholar', [{'text': '“Among the princes of India', 'at': 0.2, 'size': 66}, {'text': 'there is no greater foe', 'at': 1.4, 'size': 82, 'c': 'gold', 'hit': True},
                         {'text': 'of the Muhammadan faith than he.”', 'at': 2.4, 'size': 66}, {'text': '— Sulaiman, c. 851 CE (tr. Elliot & Dowson, 1867)', 'at': 3.4, 'size': 34}],
    sfx=[[T(336.2) + 1.4, 'hit', -8]])
ART(342.7, 'v2_a06_kannauj_aerial', **{'in': 'black'}, move='pull', fx=['dust'])
# ======================= CH3: reign =======================
MAP(348.8, 'm_growth', {'cam': [[348.8, 77, 25.5, 2.0], [359.7, 79, 26, 1.75]], 'year': {'from': 730, 'to': 885, 'at': 349.0, 'dur': 9},
                        'lands': [{'at': 349.0, 'dur': 1.8, 'color': '#b88a3a', 'pts': P_PRATIHARA_CORE, 'origin': [75.8, 23.2], 'label': 'Nagabhata ki neev', 'labelAt': [76.3, 24.6], 'until': 354.6},
                                  {'at': 352.5, 'dur': 2.4, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': [76.5, 24.5], 'label': 'Mihir Bhoj ka empire', 'labelAt': [78.5, 26.2]}],
                        'pins': [{'ll': KANNAUJ, 'at': 353.0, 'label': 'Kannauj'}],
                        'caps': [['8th century', 'Nagabhata ne <b>foundation</b> rakhi', 349.0, 352.3], ['9th century', 'North India ki <b>sabse badi military power</b>', 352.4]]})
PHOTO(352.4 + 7.3, 'bateshwar', 'Bateshwar mandir · Morena', 'Pratihara daur <b>(8th–10th century)</b>')  # 359.7: "~50 saal tak rule"
KIN(362.4, 'k_50saal', [{'text': 'c. 836', 'at': 0.1, 'size': 120, 'c': 'gold', 'hit': True}, {'text': '→', 'at': 0.6, 'size': 100}, {'text': 'c. 885 CE', 'at': 1.0, 'size': 120, 'c': 'gold', 'hit': True},
                        {'text': 'lagbhag aadhi sadi ka reign', 'at': 1.6, 'size': 56}])
PHOTO(365.1, 'kannauj_kartikeya', 'Kannauj Museum', 'Kartikeya · <b>10th century</b>', cam=[[0, 50, 45, 0.95], [0.6, 50, 35, 1.3]])
ART(368.3, 'v2_a32_procession', **{'in': 'fade'}, move='right')
ART(372.45, 'v2_a25_ruined_hall', move='push', fx=['dust', 'rays'])
ART(378.6, 'v2_a26_ramabhadra', **{'in': 'black'}, grade='night', move='push', fx=['flicker'], label={'text': 'Ramabhadra', 'sub': 'Mihir Bhoj ke pita'})
ART(381.7, 'v2_a27_raid_smoke', move='left', fx=['smoke'])
ART(384.2, 'v2_a28_sword_oath', **{'in': 'fade'}, move='push', fx=['embers'])
MAP(392.25, 'm_revival', {'cam': [[392.25, 77, 25.5, 2.6], [411.75, 77.5, 25.5, 2.3]], 'title': {'text': 'Early reign', 'sub': 'c. 836 CE'},
                          'lands': [{'at': 394.6, 'dur': 2.0, 'color': GOLD, 'pts': P_BUNDEL, 'origin': [79.5, 25], 'label': 'Bundelkhand', 'labelAt': [79.5, 24.6]},
                                    {'at': 396.0, 'dur': 2.0, 'color': GOLD, 'pts': P_GURJARATRA, 'origin': [73.2, 26.4], 'label': 'Gurjaratra', 'labelAt': [73.2, 26.2]}],
                          'pins': [{'ll': KANNAUJ, 'at': 392.4, 'label': 'Kannauj'}],
                          'caps': [['Early reign', 'Pratihara authority <b>revive</b>', 405.3]]})
rows.append((411.75, 'vs', {'type': 'timeline', 'bg': 'bg_timeline.jpg', 'label': 'Copper plate records', 'head': ['Mihir Bhoj ke <b>documents</b>', T(411.85)],
                             'events': [['836 CE', 'Barah copper plate', T(412.0), True], ['843 CE', 'Daulatpura plate', T(415.5)], ['c. 885 CE', 'Reign ka ant', T(419.0)]],
                             '_abs': True}))
ART(423.0, 'v2_a30_land_grant', **{'in': 'fade'}, move='push', fx=['dust'])
PHOTO(427.7, 'pratihara_vishnu', 'Chanderi museum', 'Prachin <b>Vishnu murti</b>', cam=[[0, 50, 55, 0.95], [0.6, 50, 65, 1.4]])
PHOTO(431.8, 'gwalior_fort', 'Gwalior Fort', 'Pratihara daur ka <b>Gwalior</b>')
ART(437.58, 'v2_a31_feudatories', move='right', fx=['dust'])
PHOTO(441.2, 'pratihara_relief', 'Chanderi museum', 'Surasundari <b>relief panel</b>', cam=[[0, 50, 55, 0.95], [0.6, 50, 60, 1.4]])
ART(443.8, 'v2_a51_seal', move='push', fx=['flicker'])
ART(447.5, 'v2_a33_army_review', **{'in': 'flash'}, punch=True, slam={'text': 'Major imperial force', 'at': 2.5})
ART(454.2, 'v2_a35_kannauj_market', **{'in': 'black'}, move='left', label={'text': 'Kannauj', 'sub': 'Pratihara capital'})
ART(456.6, 'v2_a36_envoys', move='push', fx=['dust'], slam={'text': 'Political supremacy', 'sub': 'ka centre', 'at': 0.6})
PHOTO(459.5, 'kannauj_ghat', 'Kannauj · aaj', 'Ganga plains mein <b>influence</b>')
ART(462.8, 'v2_a37_rival_envoys', **{'in': 'fade'}, move='push', fx=['flicker'])
ART(469.2, 'v2_a38_kannauj_night', **{'in': 'fade'}, move='push', grade='night')
MAP(475.4, 'm_extent', {'cam': [[475.4, 79, 25, 2.2], [480.6, 75, 28, 2.0], [484.2, 78.5, 25.5, 1.8], [491.2, 78.5, 25.5, 1.7]],
                        'lands': [{'at': 475.6, 'dur': 4.0, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ, 'label': 'Pratihara Empire', 'labelAt': [78.6, 25.8]}],
                        'tags': [{'text': 'Uttar Pradesh', 'll': [81, 27.6], 'at': 476.0}, {'text': 'Rajasthan', 'll': [73.6, 26.8], 'at': 476.8}, {'text': 'Madhya Pradesh', 'll': [78, 23.3], 'at': 477.6}, {'text': 'North-west', 'll': [75, 30.6], 'at': 481.0}],
                        'pins': [{'ll': KANNAUJ, 'at': 475.5, 'label': 'Kannauj'}],
                        'caps': [['Influence', 'Aaj ke UP · Rajasthan · <b>MP</b>', 475.8, 484.1], ['Note', 'Boundaries <b>badalti rahi</b> · map approximate', 484.3]]})
# ======================= CH4: rivals, Sulaiman, cavalry, Adivaraha =======================
ART(492.78, 'v2_a39_war_elephant', **{'in': 'black'}, move='push', fx=['dust'])
ART(497.9, 'v2_a40_tribute', move='left')
ART(501.4, 'v2_a41_pala_king', **{'in': 'flash'}, punch=True, label={'text': 'Palas', 'sub': 'Bengal–Bihar'})
ART(503.0, 'v2_a42_rashtrakuta_king', **{'in': 'flash'}, punch=True, label={'text': 'Rashtrakutas', 'sub': 'Deccan'})
CLIP(510.74, 'p_wiki_tripartite')
PHOTO(515.5, 'pala_vishnu', 'Pala dynasty · Bengal–Bihar', 'Pala school ki <b>Vishnu murti</b>', cam=[[0, 50, 50, 0.95], [0.6, 50, 35, 1.3]])
PHOTO(519.1, 'ellora_kailasa', 'Rashtrakutas · Deccan', 'Kailasa mandir, <b>Ellora</b>')
MAP(522.0, 'm_tripartite', {'cam': [[522.0, 80, 22.5, 1.75], [529.2, 80, 23.5, 1.9]], 'title': {'text': 'Tripartite Struggle', 'sub': 'Kannauj ke liye'},
                            'lands': [{'at': 522.1, 'dur': 2.0, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ, 'label': 'Pratihara', 'labelAt': [76.5, 26.5]},
                                      {'at': 522.4, 'dur': 2.0, 'color': PALA, 'pts': P_PALA, 'origin': [87.5, 24], 'label': 'Pala', 'labelAt': [87.6, 23.6]},
                                      {'at': 522.7, 'dur': 2.0, 'color': RASH, 'pts': P_RASH, 'origin': [76.5, 17.5], 'label': 'Rashtrakuta', 'labelAt': [76.8, 17.5]}],
                            'arrows': [{'at': 531.4, 'dur': 1.4, 'pts': [[87, 24.5], [84, 26.5], [80.6, 27.1]], 'color': PALA, 'width': 14, 'keep': True},
                                       {'at': 531.8, 'dur': 1.6, 'pts': [[77, 18.5], [78.5, 23], [79.6, 26.6]], 'color': RASH, 'width': 14, 'keep': True}],
                            'pins': [{'ll': KANNAUJ, 'at': 523.3, 'label': 'Kannauj', 'side': -1}],
                            'caps': [['Teen badi powers', 'Kannauj ke liye <b>lamba conflict</b>', 526.8]]})
ART(534.8, 'v2_a43_three_armies', **{'in': 'flash'}, punch=True, fx=['embers'], slam={'text': 'Tripartite Struggle', 'at': 0.3, 'color': '#ffd27a'}, shake=[535.1])
ART(537.3, 'v2_a44_dhow_port', **{'in': 'black'}, move='push', fx=['dust'])
ART(540.2, 'v2_a45_port_market', **{'in': 'fade'}, move='left')
CLIP(543.3, 'p_sulaiman_full')
MAP(558.7, 'm_sulaiman', {'cam': [[558.7, 62, 24, 1.6], [563.1, 70, 24, 1.8], [567.9, 74, 25, 1.9]],
                          'arrows': [{'at': 559.4, 'dur': 2.4, 'pts': [[52.6, 27.7], [60, 24.5], [68, 22], [72.6, 21.0]], 'color': '#e9f5ec', 'width': 10, 'keep': True},
                                     {'at': 561.6, 'dur': 1.4, 'pts': [[72.6, 21.0], [76, 24.5], KANNAUJ], 'color': GOLD, 'width': 10, 'keep': True}],
                          'lands': [{'at': 561.4, 'dur': 2.0, 'color': GOLD, 'pts': P_PRATIHARA_PEAK, 'origin': KANNAUJ, 'label': 'Juzr (Gurjara)', 'labelAt': [78.5, 26]}],
                          'pins': [{'ll': [52.6, 27.7], 'at': 559.2, 'label': 'Siraf', 'sub': 'Arab port', 'side': -1}],
                          'caps': [['Reputation', 'India ke <b>bahar bhi</b> known', 563.3]]})
WAR(567.9, 'war_cavalry', clashes=[9.6, 11.4], gallops=[3.0, 6.0])
ART(582.4, 'v2_a46_horse_fair', **{'in': 'black'}, move='push', fx=['dust', 'rays'])
CLIP(585.6, 'p_ei184')
ART(595.1, 'v2_a47_temple_gift', **{'in': 'fade'}, move='push', fx=['flicker'])
ART(600.8, 'v2_a48_bard', **{'in': 'fade'}, move='right', fx=['embers'])
KIN(604.1, 'k_context', [{'text': 'TRADE', 'at': 0.1, 'size': 120, 'hit': True}, {'text': 'INSCRIPTIONS', 'at': 1.0, 'size': 120, 'c': 'gold', 'hit': True},
                         {'text': 'EXTERNAL ACCOUNTS', 'at': 2.1, 'size': 110, 'hit': True}],
    sfx=[[T(604.1) + 0.1, 'hit', -8], [T(604.1) + 1.0, 'hit', -8], [T(604.1) + 2.1, 'hit', -8]])
ART(613.6, 'v2_a49_varaha_idol', **{'in': 'black'}, move='push', fx=['smoke', 'flicker'], slam={'text': 'Adivaraha', 'at': 616.9 - 613.6, 'color': '#ffd27a'})
PHOTO(617.9, 'varaha_udayagiri', 'Varaha · Udayagiri caves', 'Vishnu ka <b>boar avatar</b>', cam=[[0, 50, 40, 0.95], [0.6, 50, 25, 1.25]])
PHOTO(622.0, 'varaha_pratihara', 'Pratihara coin · 850–900 CE', 'Sikke par <b>Varaha</b>', marks=[{'k': 'circle', 'r': [20, 10, 62, 80], 'at': 0.9, 'c': 'gold', 'note': 'Varaha', 'side': 'right'}])
PHOTO(625.0, 'coin_pratihara', 'National Museum, Delhi', 'Pratihara-kaal ka <b>chandi ka sikka</b>')
KIN(629.0, 'k_titles', [{'text': 'TITLES', 'at': 0.1, 'size': 130, 'hit': True}, {'text': 'SYMBOLS', 'at': 0.8, 'size': 130, 'c': 'gold', 'hit': True}, {'text': 'AUTHORITY', 'at': 1.5, 'size': 130, 'hit': True}])
ART(632.1, 'v2_a52_final_rampart', **{'in': 'fade'}, move='pull', fx=['dust', 'rays'])
for k in ('p_wiki_mihir', 'p_wiki_pratihara', 'p_wiki_nagabhata', 'p_ei101', 'p_ei103a', 'p_wiki_tripartite', 'p_sulaiman_full', 'p_ei184'):
    once(k)

# ======================= write =======================
rows.sort(key=lambda r: r[0])
starts = [T(t) for t, _, _ in rows]
assert all(b >= a for a, b in zip(starts, starts[1:])), 'shot order changed after the time conversion'
CH3 = [0, T(157.7), T(304.0), T(469.2), END]


def chapter(t):
    for i in range(len(CH3) - 1):
        if CH3[i] <= t < CH3[i + 1]:
            return i
    return len(CH3) - 2


scenes, specs, cur = [], [[] for _ in range(4)], None
for k, (t, kind, x) in enumerate(rows):
    a, b = starts[k], (starts[k + 1] if k + 1 < len(rows) else END)
    if b - a < 0.3:
        print(f'warning: shot at {t} (new {a}) lasts {b - a:.2f}s')
    if kind == 'vs':
        s = {'t': a, **x}
        s.pop('_abs', None)
        if s['type'] == 'clip':
            nm = s['clip'][:-4]
            if nm in NEWPROOFS:
                NEWPROOFS[nm]['dur'] = round(b - a + 0.1, 2)
            if nm in MAPS:
                MAPS[nm] = (MAPS[nm][0], MAPS[nm][1], round(b - a + 0.1, 2))
        scenes.append(s)
        cur = None
        continue
    ai = a
    while ai < b - 1e-6:
        ci = chapter(ai)
        bi = min(b, CH3[ci + 1])
        shot = dict(x, t=round(ai - CH3[ci], 2))
        if 'shake' in shot:
            shot['shake'] = [round(T(s) - CH3[ci], 2) for s in shot['shake']]
        if ai != a:
            for z in ('slam', 'in', 'punch', 'label'):
                shot.pop(z, None)
        specs[ci].append(shot)
        if cur != ci:
            scenes.append({'t': round(ai, 2), 'type': 'clip', 'clip': f'mb3_ch{ci + 1}.mp4', 'from': round(ai - CH3[ci], 2), 'zoom': 1.0, 'quiet': True})
            cur = ci
        ai = bi

# Doc chapters: blank cards under every non-art stretch (cheap), one shot per start second
J = AS / 'jobs' / V / 'v3'
(J / 'maps').mkdir(parents=True, exist_ok=True)
for ci, shots in enumerate(specs):
    length = round(CH3[ci + 1] - CH3[ci], 2)
    blanks = [{'t': round(s['t'] - CH3[ci], 2), 'kind': 'card', 'text': ''} for s in scenes
              if not s.get('clip', '').startswith('mb3_ch') and CH3[ci] <= s['t'] < CH3[ci + 1]]
    allshots = sorted(shots + blanks + [{'t': 0, 'kind': 'card', 'text': ''}], key=lambda z: (z['t'], z.get('text') != ''))
    uniq = {}
    for z in allshots:
        if z['t'] not in uniq or uniq[z['t']].get('text') == '':
            uniq[z['t']] = z
    ss = [z for z in uniq.values() if z['t'] < length - 0.05]
    ss = [z for i, z in enumerate(ss) if i + 1 == len(ss) or ss[i + 1]['t'] - z['t'] >= 0.5 or z.get('text') != '']
    (J / f'ch{ci + 1}.json').write_text(json.dumps({'end': length, 'grade': 'warm', 'shots': ss}, indent=1, ensure_ascii=False))

# sound accents on art hits
for s in scenes:
    if s.get('clip', '').startswith('mb3_ch'):
        end = next((z['t'] for z in scenes if z['t'] > s['t']), END)
        cues = []
        for t, kind, x in rows:
            if kind != 'doc' or not (s['t'] <= T(t) < end):
                continue
            if x.get('in') == 'flash':
                cues.append([T(t), 'whoosh', -10])
            if 'slam' in x:
                cues.append([round(T(t) + x['slam'].get('at', 0), 2), 'hit', -6])
        if cues:
            s['sfx'] = sorted(cues)


def conv(spec, t0, dur):
    """old-narration times inside a map spec -> seconds from the start of the shot."""
    r = lambda v: round(max(0.0, T(v) - t0), 2)
    out = {'end': dur, **{k: v for k, v in spec.items()}}
    out['cam'] = [[r(c[0]), c[1], c[2], c[3]] for c in spec['cam']]
    if 'year' in spec:
        out['year'] = {**spec['year'], 'at': r(spec['year']['at'])}
    for key in ('lands', 'arrows', 'pins', 'tags'):
        if key in spec:
            out[key] = [{**z, 'at': r(z['at']), **({'until': r(z['until'])} if 'until' in z else {})} for z in spec[key]]
    if 'caps' in spec:
        out['caps'] = [[c[0], c[1], r(c[2])] + ([r(c[3])] if len(c) > 3 else []) for c in spec['caps']]
    return out


for name, (t, spec, dur) in MAPS.items():
    (J / 'maps' / f'{name}.json').write_text(json.dumps(conv(spec, T(t), dur), indent=1, ensure_ascii=False))

hook_end = T(HOOK_END)
beats = [{**b, 't': T(t)} for t, b in HOOK]
for b in beats:  # hook pictures are served from public/jobs/<V>/hook/
    for key in ('imgs',):
        if key in b:
            b[key] = [f'jobs/{V}/hook/{p}' for p in b[key]]
    if 'bg' in b:
        b['bg'] = f'jobs/{V}/hook/{b["bg"]}'
    if 'img' in b:
        b['img'] = f'jobs/{V}/hook/{b["img"]}'
(J / 'hook_v3.json').write_text(json.dumps({'end': round(hook_end + 0.1, 2), 'beats': beats}, indent=1, ensure_ascii=False))

# proofs: keep the already rendered document shots, add the new ones
pj = json.loads((VD / 'proofs.json').read_text())
pj['shots'].update(NEWPROOFS)
(VD / 'proofs.json').write_text(json.dumps(pj, indent=1, ensure_ascii=False))

sp = VD / 'scenes.json'
d = json.loads(sp.read_text())
d['scenes'] = scenes
d['voice'] = f'videos/{V}/audio-edit/narration_v3.wav'
d['duration'] = END
d['music'] = [
    {'file': 'library/music/Crypto.mp3', 'from': 0, 'to': T(78.2), 'below_voice_db': 10},
    {'file': 'library/music/Interloper.mp3', 'from': T(78.2), 'to': T(157.7), 'below_voice_db': 12},
    {'file': 'library/music/Decline.mp3', 'from': T(157.7), 'to': T(304.0), 'below_voice_db': 12},
    {'file': 'library/music/Long_Note_Two.mp3', 'from': T(304.0), 'to': T(492.78), 'below_voice_db': 13},
    {'file': 'library/music/Stay_the_Course.mp3', 'from': T(492.78), 'to': END, 'below_voice_db': 12},
]
d.pop('parts', None)
sp.write_text(json.dumps(d, indent=1, ensure_ascii=False))
print(len(scenes), 'scenes;', [len(s) for s in specs], 'art shots per chapter;', len(MAPS), 'maps;', len(NEWPROOFS), 'new proof shots; end', END)
