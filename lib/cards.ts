// @ts-nocheck
import { find, round } from "lodash";
import { mean, std } from "mathjs";
import NormalDistribution from "normal-distribution";

import { LATEST_SET } from "lib/constants";
import { Card, MagicSet, Grade, Rarity } from "lib/types";
import { getCardColumn, getCardTypes } from "lib/scryfall";
import {
  connect as connectToCache,
  IS_ENABLED as CACHE_IS_ENABLED,
} from "lib/cache";
import Chord from 'grades/Chord.json';
import Ncaa from 'grades/Ncaa.json';
import Doubleexposure from 'grades/Doubleexposure.json';
import Squerp from 'grades/Squerp.json';
import ElgraNorbe from 'grades/ElgraNorbe.json';

const GradesMap = {
  "Chord": Chord,
  "Ncaa": Ncaa,
  "Doubleexposure": Doubleexposure,
  "Squerp": Squerp,
  "ElgraNorbe": ElgraNorbe,
}

interface ApiCard {
  name: string;
  drawn_improvement_win_rate: number;
  ever_drawn_game_count: number;
  ever_drawn_win_rate: number;
  game_count: number;
  rarity: Rarity | "basic";
  url: string;
  url_back: string;
}

const GRADE_THRESHOLDS: [Grade, number][] = [
  [Grade.A_PLUS, 99],
  [Grade.A, 95],
  [Grade.A_MINUS, 90],
  [Grade.B_PLUS, 85],
  [Grade.B, 76],
  [Grade.B_MINUS, 68],
  [Grade.C_PLUS, 57],
  [Grade.C, 45],
  [Grade.C_MINUS, 36],
  [Grade.D_PLUS, 27],
  [Grade.D, 17],
  [Grade.D_MINUS, 5],
  [Grade.F, 0],
];

const GRADE_POINTS: Record<string,number> = {
  "A+": 12,
  "A": 11,
  "A-": 10,
  "B+": 9,
  "B": 8,
  "B-": 7,
  "C+": 6,
  "C": 5,
  "C-": 4,
  "D+": 3,
  "D": 2,
  "D-": 1,
  "F": 0, 
};

const SET_START_DATES: Partial<Record<MagicSet, string>> = {
  [MagicSet.CRIMSON_VOW]: "2021-11-11",
};

export async function getCards(set: MagicSet, grades: string): Promise<Card[]> {
  if (!CACHE_IS_ENABLED) {
    return await buildCardStore(set, grades);
  }

  const client = await connectToCache();
  console.log(`attempting to fetch 17lands data for ${set} from cache`);
  const cacheHit = await client.get(set);
  if (cacheHit) {
    console.log("cache hit");
    return JSON.parse(cacheHit);
  }
  console.log("cache miss");

  const cards = await buildCardStore(set, grades);
  const expirationInHours =
    set === LATEST_SET ? 12 : 24 * 7;
  await client.set(set, JSON.stringify(cards), expirationInHours);
  await client.disconnect();
  return cards;
}

async function buildCardStore(set: MagicSet, grades: string): Promise<Card[]> {
  const cards: { [key: string]: Card } = {};
  let apiCards: ApiCard[] = await fetchApiCards(set);
  apiCards = apiCards.filter(
    (card) => card.ever_drawn_game_count >= 200 && card.ever_drawn_win_rate
  );

  if (apiCards.length <= 1) {
    return [];
  }

  const winrates = apiCards.map((card) => card.ever_drawn_win_rate);
  const normalDistribution = new NormalDistribution(
    mean(winrates),
    std(winrates)
  );
  for (const apiCard of apiCards) {
    const cardUrl = apiCard.url;
    let card = cards[cardUrl];
    if (!card) {
      // For some reason, Amonkhet split cards are mistakently referenced by 17lands with three slashes
      const cardName = apiCard.name.replace("///", "//");
      const guessedGradeInfo = find(
        GradesMap[grades],
        (guess) => guess.name === cardName
      ) || {"tier" : "C"};
      let guessedGrade: Grade = guessedGradeInfo.tier as Grade;
      if (guessedGrade == ("SB" as Grade) || guessedGrade == ("TBD" as Grade)) {
        guessedGrade = Grade.F;
      }
      card = {
        name: cardName,
        column: await getCardColumn(cardName),
        rarity: apiCard.rarity === "basic" ? Rarity.COMMON : apiCard.rarity,
        cardTypes: await getCardTypes(cardName),
        cardUrl: apiCard.url,
        cardBackUrl: apiCard.url_back,
        winrate: 0,
        gameCount: 0,
        grade: Grade.C,
        guessedGrade: guessedGrade,
        diff: 0,
        diffSvg: "/chevron_up_icon_136782.svg",
      };
      cards[cardUrl] = card;
    }

    const score = normalDistribution.cdf(apiCard.ever_drawn_win_rate) * 100;
    const grade: Grade = find<[Grade, number]>(
      GRADE_THRESHOLDS,
      ([grade, threshold]) => score >= threshold
    )![0];
    card.diff = compareGrades(grade, card.guessedGrade)
    if (card.diff <= -3) {
      card.diffSvg = "/chevron_triple_down_icon_135769.svg";
    } else if (card.diff == -2) {
      card.diffSvg = "/chevron_double_down_icon_136787.svg";
    } else if (card.diff == -1) {
      card.diffSvg = "/chevron_down_icon_138765.svg";
    } else if (card.diff == 0) {
      card.diffSvg = "/crown_icon_135729.svg";
    } else if (card.diff == 1) {
      card.diffSvg = "/chevron_up_icon_136782.svg";
    } else if (card.diff == 2) {
      card.diffSvg = "/chevron_double_up_icon_138766.svg";
    } else {
      card.diffSvg = "/chevron_triple_up_icon_137765.svg";
    }

    card.winrate = round(apiCard.ever_drawn_win_rate, 4)
    card.gameCount = apiCard.game_count
    card.grade = grade
  }

  return Object.values(cards);
}

async function fetchApiCards(set: MagicSet): Promise<ApiCard[]> {
  const urlParams: Record<string, string> = {
    expansion: set,
    format: "PremierDraft",
    start_date: SET_START_DATES[set] || "2020-04-16",
    end_date: new Date().toISOString().substring(0, 10),
  };

  const queryString = new URLSearchParams(urlParams).toString();
  const url = `https://www.17lands.com/card_ratings/data?${queryString}`;

  console.log(`Making API request to ${url}`);
  let response = await fetch(url);
  while (!response.ok) {
    console.log("request failed, retrying in 10 seconds");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    response = await fetch(url);
  }
  console.log("request succeeded");

  return await response.json();
}

function compareGrades(firstGrade: Grade, secondGrade: Grade): number {
  return GRADE_POINTS[firstGrade] - GRADE_POINTS[secondGrade];
}
