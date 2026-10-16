import { act1End, act1Intro, act1Mid, prologue } from './act0_1';
import { act2End, act2Intro, act2Mid, act2Past, act2Recursion } from './act2';
import { act3End, act3Incident, act3Intro } from './act3';
import { act4End, act4Intro, act4Mid, act5End, act5Intro } from './act4_5';
import { act6End, act6Intro, act6Mid, act7End, act7Intro, wake } from './act6_7';
import type { Scene } from './types';

export const SCENES: Record<string, Scene> = Object.fromEntries(
  [prologue, act1Intro, act1Mid, act1End, act2Intro, act2Past, act2Mid, act2Recursion, act2End,
    act3Intro, act3Incident, act3End, act4Intro, act4Mid, act4End, act5Intro, act5End,
    act6Intro, act6Mid, act6End, act7Intro, act7End, wake].map((s) => [s.id, s]),
);
