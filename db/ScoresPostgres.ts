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
                db.connection().connect().then((client: pg.PoolClient) => {
                    const result = client.query(queries.getScoreByName(name))
                        .then((result: pg.QueryResult<Score>) => {
                            return result.rows;
                        })
                        .catch((err: Error) => {
                            return {error: err.message};
                        });
                    client.release();
                    return result;
                }) : {error: 'name is not correct'};
        },
        getScores: async (): Promise<Score[] | { error : string }> => {
            return db.connection().connect().then((client: pg.PoolClient) => {
                const result = client
                    .query(queries.getScores())
                    .then((result: pg.QueryResult<Score>) => {
                        return result.rows
                    })
                    .catch((err: Error) => {
                        return {error: err.message}
                    });
                client.release();
                return result;
            });
        },
        uploadScore: async (name: string, score: number): Promise<Score[] | { error : string }> => {
            return (CheckName(name) && CheckScore(score)) ?
                db.connection().connect().then((client: any) => {
                    const result = client
                        .query(queries.uploadScore(name, score))
                        .then((result: pg.QueryResult<Score>) => {
                            return result
                        })
                        .catch((err: Error) => {
                            return { error : err.message }
                        });
                    client.release();
                    return result;
                }) :
                { error : 'the data is not correct' };
        }
    };
}
