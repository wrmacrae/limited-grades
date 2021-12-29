import { groupBy, sortBy } from "lodash";
import { GetStaticPropsContext, InferGetStaticPropsType } from "next";
import { useRouter } from "next/dist/client/router";
import React, { useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import styled from "styled-components";

import { getCards } from "../lib/cards";
import {
  Column,
  Deck,
  Rarity,
  Set as MagicSet,
  Grade,
  Card,
} from "../lib/types";
import CardView from "../components/CardView";
import RarityFilter from "../components/RarityFilter";
import SetSelector from "../components/SetSelector";
import DeckSelector from "../components/DeckSelector";
import { COLUMN_ICONS } from "../lib/constants";
import CardDetailModal from "../components/CardDetailModal";
import Footer from "../components/Footer";

const PageContainer = styled(Container)`
  overflow: auto;
`;

const GradeRowHeader = styled.th`
  width: 3%;
  vertical-align: middle;
  background-color: #f0f1f2 !important;
`;

const CardColumnHeader = styled.th`
  text-align: center;
  width: 14%;
  background-color: #f0f1f2 !important;
`;

export const getStaticPaths = async () => {
  return {
    paths: Object.values(MagicSet).map((set) => ({ params: { set } })),
    fallback: false,
  };
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const set = context.params!.set as MagicSet;
  return {
    props: {
      set,
      cards: await getCards(set),
      lastUpdatedAtTicks: new Date().getTime(),
    },
    // Rebuild pages from 17Lands data every twelve hours
    revalidate: 12 * 60 * 60,
  };
};

const Page = ({
  set,
  cards,
  lastUpdatedAtTicks,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const router = useRouter();
  const [deck, setDeck] = useState(Deck.ALL);
  const [visibleRarities, setVisibleRarities] = useState(
    new Set(Object.values(Rarity))
  );
  const [modalCard, setModalCard] = useState<Card>();

  const sortedCards = sortBy(
    cards.filter((card) => deck in card.stats),
    (card) => -card.stats[deck]!.score
  );
  const cardsByGroup = groupBy(
    sortedCards,
    (card) => card.column + "," + card.stats[deck]!.grade
  );

  return (
    <PageContainer fluid>
      <h1 className="text-center p-4">Limited Grades</h1>
      <Row className="justify-content-center">
        <Col xl="6">
          <p>
            The table below uses{" "}
            <a
              href="https://www.17lands.com/card_ratings"
              target="_blank"
              rel="noreferrer"
            >
              17Lands
            </a>{" "}
            Premier Draft data to assign letter grades to cards. It infers a
            normal distribution from the{" "}
            <a
              href="https://www.17lands.com/metrics_definitions#:~:text=Games%20in%20Hand%20Win%20Rate%20(GIH%20WR)"
              target="_blank"
              rel="noreferrer"
            >
              Games in Hand Win Rate
            </a>{" "}
            statistic and uses that distribution to assign a grade to each card.
            For example, a card with a win rate that is one standard deviation
            higher than the mean would get a B. Cards drawn fewer than 200 times
            are not included.
          </p>
        </Col>
      </Row>
      <Row className="justify-content-center mb-2">
        <Col md="auto">
          <SetSelector
            value={set}
            onChange={(newValue) => {
              router.push(`/${newValue}`);
            }}
          />
        </Col>
        <Col md="auto">
          <DeckSelector value={deck} onChange={setDeck} />
        </Col>
        <Col md="auto">
          <RarityFilter
            set={set}
            values={visibleRarities}
            setValues={setVisibleRarities}
          />
        </Col>
      </Row>
      <Table>
        <thead>
          <tr>
            <th></th>
            {Object.values(Column).map((column) => (
              <CardColumnHeader key={column}>
                <i className={COLUMN_ICONS[column]}></i>
              </CardColumnHeader>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.values(Grade).map((grade) => (
            <tr key={grade}>
              <GradeRowHeader>{grade}</GradeRowHeader>
              {Object.values(Column).map((column) => (
                <td key={column}>
                  {cardsByGroup[column + "," + grade]
                    ?.filter((card) => visibleRarities.has(card.rarity))
                    .map((card) => (
                      <CardView
                        key={card.cardUrl}
                        card={card}
                        onClick={() => setModalCard(card)}
                      />
                    ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      <CardDetailModal
        card={modalCard}
        handleClose={() => setModalCard(undefined)}
      />
      <Footer lastUpdatedAtTicks={lastUpdatedAtTicks} />
    </PageContainer>
  );
};

export default Page;
