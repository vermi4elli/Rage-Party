'use strict';

import {PostgresConnection} from './PostgresConnection';
import {MongoConnection} from './MongoConnection';

type Score = Record<string, number>

type Scores = {
    getScoreByName: (name: string) => Promise<Score>,
    getScores: () => Promise<Score>,
    uploadScore: (name: string, score: number) => void
};

const getScoreByName = (name: string) => `select name, score from scores where name = \'${name}\';`;
const getScores = () => 'select name, score from scores;';
const uploadScore = (name: string, score: number) => `insert into scores (name, score) VALUES (\'${name}\', ${score})`;

export const ScoresPostgres = (db: PostgresConnection): Scores => {
    return {
        getScoreByName: async (name: string) => {
            return db.connection()
                .query(getScoreByName(name))
                .then((result: JSON) => result)
                .catch((err: Error) => console.log(err));
        },
        getScores: async () => {
            return db.connection()
                .query(getScores())
                .then((result: JSON) => result)
                .catch((err: Error) => console.log(err));
        },
        uploadScore: async (name: string, score: number) => {
            return db.connection()
                .query(uploadScore(name, score))
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

