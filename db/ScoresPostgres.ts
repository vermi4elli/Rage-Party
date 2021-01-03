'use strict';

import {PostgresConnection} from './PostgresConnection';
import * as queries from './Queries';
import {Score, Scores} from "./DBInterface";
import {CheckName, CheckScore} from "./InputValidator";

export const DBScores = (db: PostgresConnection): Scores => {
    return {
        getScoreByName: async (name: string) => {
            if (CheckName(name)) {
                return db.connection()
                    .query(queries.getScoreByName(name))
                    .then((result: Score) => result.rows)
                    .catch((err: Error) => console.log(err));
            } else {

            }
        },
        getScores: async () => {
            return db.connection()
                .query(queries.getScores())
                .then((result: Score) => result.rows)
                .catch((err: Error) => console.log(err));
        },
        uploadScore: async (name: string, score: number) => {
            if (CheckName(name) && CheckScore(score)) {
                return db.connection()
                    .query(queries.uploadScore(name, score))
                    .catch((err: Error) => console.log(err));
            } else {

            }
        }
    };
}
