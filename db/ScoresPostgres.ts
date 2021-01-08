'use strict';

import {PostgresConnection} from './PostgresConnection';
import * as queries from './Queries';
import * as pg from 'pg';
import {Score, Scores} from "./DBInterface";
import {CheckName, CheckScore} from "./InputValidator";

export const DBScores = (db: PostgresConnection): Scores => {
    return {
        getScoreByName: async (name: string): Promise<Score[] | { error : string }> => {
            return CheckName(name) ?
                db.connection().connect().then((client: pg.PoolClient) =>
                    client.query(queries.getScoreByName(name))
                    .then((result: pg.QueryResult<Score>) => {
                        return result.rows;
                    })
                    .catch((err: Error) => {
                        return {error: err.message};
                    })) : {error: 'name is not correct'};
        },
        getScores: async (): Promise<Score[] | { error : string }> => {
            return db.connection().connect().then((client: pg.PoolClient) =>
                client
                    .query(queries.getScores())
                    .then((result: pg.QueryResult<Score>) => {
                        return result.rows
                    })
                    .catch((err: Error) => {
                        return {error: err.message}
                    }));
        },
        uploadScore: async (name: string, score: number): Promise<Score[] | { error : string }> => {
            return (CheckName(name) && CheckScore(score)) ?
                db.connection().connect().then((client: any) =>
                    client
                        .query(queries.uploadScore(name, score))
                        .then((result: pg.QueryResult<Score>) => {
                            return result
                        })
                        .catch((err: Error) => {
                            return { error : err.message }
                        })) :
                { error : 'the data is not correct' };
        }
    };
}
