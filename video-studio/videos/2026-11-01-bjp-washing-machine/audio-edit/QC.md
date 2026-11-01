# Narration QC — 2026-11-01

Original: `voice/original.mp3` (copy of Downloads source; original untouched). Clean derivative: `narration_clean.wav`, 48 kHz mono, mean about -14.4 dB and peak -1.5 dB. Edited derivative: `narration_edit.wav`, 435.1 s, removes the unrelated spoken outtake at 435.1–437.5 s and final tail; original 440.581 s remains. Opening 32-second sample uses the cleaned narration and is unaffected by the ending cut.

Large-v3 Hindi transcript: `../timing/segments_hi.json` and `transcript_hi.txt`, 94 segments. These are machine outputs and need an ear-led pass. A separate short-window transcription confirmed the spoken year at ~125–139 s sounds like **2025** twice, although the documented BJP switch was in **August 2015**. Request a replacement in the creator's own voice for both sentences before the full-video render; the edit must not silently display 2015 while audio says 2025.

At ~252.8–275.5 s the large model collapsed multiple sentences. A second small-model pass (`gap_check/`) confirms more speech, including an apparent September 2022 case update, but the text is unreliable. Review that source audio and its exact case reference before cutting or illustrating it. Do not rely on the large transcript there.

No ≥0.7 s passages below -40 dB were detected in cleaned audio. This does not establish absence of retakes, fumbles, mouth noise or bad edits. Full perceptual listening still required before final export.
