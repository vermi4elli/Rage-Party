'use strict';

import {MongoConnection} from './MongoConnection';
import {CheckName, CheckScore} from "./InputValidator";
import {Scores, Score} from "./DBInterface";

export const DBScores = (db: MongoConnection): Scores => {
    return {
        getScoreByName: async (name: string) : Promise<Score[] | { error : string }> => {
            const collection = db.connection().collection('scores');
            return CheckName(name) ? collection.findOne({name: name}) : {};
        },
        getScores: async (): Promise<Score[]> => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name: string, score: number): Promise<Score> => {
            return (CheckName(name) && CheckScore(score)) ? db.connection().collection('scores').insertOne({name: name, score: score},
                (err: Error, result: any) => {
                if(err){
                    console.log(err);
                }
                console.log(result.ops);
                result.ops;
            }) : {};
        },
        deleteScore: async (name: string): Promise<Score> => {
            const collection = db.connection().collection('scores');
            return CheckName(name) ? collection.remove({name: name}) : {};
        }
    };
}
