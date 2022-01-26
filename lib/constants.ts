import { Column, Deck, MagicSet } from "lib/types";

export const LATEST_SET = MagicSet.CRIMSON_VOW;

export const SET_LABELS: Record<MagicSet, string> = {
  [MagicSet.CRIMSON_VOW]: "Crimson Vow",
};

export const COLUMN_ICONS: Record<Column, string> = {
  [Column.WHITE]: "ms ms-w ms-cost",
  [Column.BLUE]: "ms ms-u ms-cost",
  [Column.BLACK]: "ms ms-b ms-cost",
  [Column.RED]: "ms ms-r ms-cost",
  [Column.GREEN]: "ms ms-g ms-cost",
  [Column.MULTICOLOR]: "ms ms-multicolor ms-duo ms-duo-color ms-grad",
  [Column.COLORLESS]: "ms ms-c ms-cost",
};

export const DECK_LABELS: Record<Deck, string> = {
  [Deck.ALL]: "All decks",
  [Deck.WHITE_BLUE]: "Azorius",
  [Deck.BLUE_BLACK]: "Dimir",
  [Deck.BLACK_RED]: "Rakdos",
  [Deck.RED_GREEN]: "Gruul",
  [Deck.WHITE_GREEN]: "Selesnya",
  [Deck.WHITE_BLACK]: "Orzhov",
  [Deck.BLUE_RED]: "Izzet",
  [Deck.BLACK_GREEN]: "Golgari",
  [Deck.WHITE_RED]: "Boros",
  [Deck.BLUE_GREEN]: "Simic",
};

export const DECK_COLORS: Record<Deck, Column[]> = {
  [Deck.ALL]: [],
  [Deck.WHITE_BLUE]: [Column.WHITE, Column.BLUE],
  [Deck.BLUE_BLACK]: [Column.BLUE, Column.BLACK],
  [Deck.BLACK_RED]: [Column.BLACK, Column.RED],
  [Deck.RED_GREEN]: [Column.RED, Column.GREEN],
  [Deck.WHITE_GREEN]: [Column.WHITE, Column.GREEN],
  [Deck.WHITE_BLACK]: [Column.WHITE, Column.BLACK],
  [Deck.BLUE_RED]: [Column.BLUE, Column.RED],
  [Deck.BLACK_GREEN]: [Column.BLACK, Column.GREEN],
  [Deck.WHITE_RED]: [Column.WHITE, Column.RED],
  [Deck.BLUE_GREEN]: [Column.BLUE, Column.GREEN],
};
