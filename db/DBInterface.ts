'use strict';

import {PostgresConnection} from './PostgresConnection';
import {MongoConnection} from './MongoConnection';
import * as queries from './Queries';

type Score = Record<string, number>

type Scores = {
    getScoreByName: (name: string) => Promise<Score>,
    getScores: () => Promise<Score>,
    uploadScore: (name: string, score: number) => void
};

export const ScoresPostgres = (db: PostgresConnection): Scores => {
    return {
        getScoreByName: async (name: string) => {
            return db.connection()
                .query(queries.getScoreByName(name))
                .then((result: JSON) => result)
                .catch((err: Error) => console.log(err));
        },
        getScores: async () => {
            return db.connection()
                .query(queries.getScores())
                .then((result: JSON) => result)
                .catch((err: Error) => console.log(err));
        },
        uploadScore: async (name: string, score: number) => {
            return db.connection()
                .query(queries.uploadScore(name, score))
                .catch((err: Error) => console.log(err));
        }
    };
}

export const ScoresMongo = (db: MongoConnection): Scores => {
    return {
        getScoreByName: async (name: string) => {
            const collection = db.connection().collection('scores');
            return collection.findOne({name: name});
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name: string, score: number) => {
            return db.connection().collection('scores').insertOne({name: name, score: score},
                (err: any, result: any) => {
                    if(err){
                        return console.log(err);
                    }
                    console.log(result.ops);
            });
        }
    };
}

