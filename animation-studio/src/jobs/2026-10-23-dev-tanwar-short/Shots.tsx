import React from 'react';
import {ShotsEdit, Shot, ShotsEditProps} from '../../components/ShotsEdit';

// Dev Tanwar fight Short: data only. Panels = public/shots/shots_sN_pM.png. Audio = edited narration (19.9 s) + 2 s tail.
const SHOTS: Shot[] = [
  {a: 0.0, b: 1.8, p: '1_1', z0: 1.0, z1: 1.18, pair: '1_3'},
  {a: 1.8, b: 3.4, p: '1_3', z0: 1.0, z1: 1.2, pair: '1_1'},
  {a: 3.4, b: 4.4, p: '1_2', z0: 1.0, z1: 1.25, pair: '1_3'},
  {a: 4.4, b: 5.1, p: '1_4', z0: 1.0, z1: 1.3, pair: '1_2'},
  {a: 5.1, b: 6.0, p: '2_1', z0: 1.0, z1: 1.4, pair: '2_2'},
  {a: 6.0, b: 7.0, p: '2_2', z0: 1.08, z1: 1.0, pair: '2_1'},
  {a: 7.0, b: 8.3, p: '2_3', z0: 1.0, z1: 1.15, pair: '2_4'},
  {a: 8.3, b: 9.9, p: '2_4', z0: 1.0, z1: 1.18, pair: '2_3'},
  {a: 9.9, b: 10.8, p: '3_1', z0: 1.0, z1: 1.15, pair: '2_1'},
  {a: 10.8, b: 11.3, p: '2_1', z0: 1.15, z1: 1.3, pair: '3_1'},
  {a: 11.3, b: 11.8, p: '3_1', z0: 1.0, z1: 1.15, pair: '2_1'},
  {a: 11.8, b: 12.3, p: '2_1', z0: 1.15, z1: 1.3, pair: '3_1'},
  {a: 12.3, b: 13.0, p: '3_1', z0: 1.0, z1: 1.2, pair: '2_1'},
  {a: 13.0, b: 13.8, p: '3_2', z0: 1.0, z1: 1.2, pair: '3_1'},
  {a: 13.8, b: 15.2, p: '3_3', z0: 1.0, z1: 1.18, pair: '3_2'},
  {a: 15.2, b: 17.3, p: '3_4', z0: 1.0, z1: 1.25, pair: '3_3'},
  {a: 17.3, b: 19.05, p: '4_1', z0: 1.0, z1: 1.3, pair: '3_3'},
  {a: 19.05, b: 19.9, p: '4_2', z0: 1.25, z1: 1.0, pair: '4_1'},
  {a: 19.9, b: 20.9, p: '4_3', z0: 1.0, z1: 1.2, pair: '4_2'},
  {a: 20.9, b: 22.0, p: '4_4', z0: 1.0, z1: 1.15, pair: '4_3'},
];
const common: Omit<ShotsEditProps, 'split'> = {
  prefix: 'shots',
  audio: 'jobs/2026-10-23-dev-tanwar-short/fight.wav',
  shots: SHOTS,
  hits: [5.1, 6.0, 7.0, 9.9, 10.8, 11.3, 11.8, 12.3, 13.0, 15.2, 15.6, 16.0, 16.4, 16.8, 19.05],
  big: [13.0, 19.05],
  captions: [
  [0, 3.4, 'Hotel ki parking, raat'],
  [3.4, 5.0, 'Neeraj bhai aaye. Boxer kahan hai?'],
  [5.0, 7.0, 'Neeraj bhai ne maara ghoosa!'],
  [7.0, 9.8, 'Boxer ne ulta maara. Par Neeraj bhai ke liye itna hi bahut tha'],
  [9.8, 13.7, 'Boxer ne block kiya. 4 ghoose mein saare block toot gaye'],
  [13.7, 17.3, 'Phir pakad ke pata-pat... pasli tod di'],
  [17.3, 19.9, 'Ek ghoosa aur... jabda tod diya!'],
  [19.9, 22, 'Boxer ghayal'],
  ],
  slams: [
    {text: 'BLOCK TOOTA!', at: 13.0, rotate: -6},
    {text: 'PAT PAT PAT!', at: 15.3, rotate: 5},
    {text: 'JABDA TOOTA!', at: 19.1, size: 120},
  ],
};
export const ShotsA: React.FC = () => <ShotsEdit {...common} />;
export const ShotsB: React.FC = () => <ShotsEdit {...common} split />;
