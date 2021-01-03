'use strict';

import {MongoConnection} from './MongoConnection';
import {CheckName, CheckScore} from "./InputValidator";
import {Scores} from "./DBInterface";

export const DBScores = (db: MongoConnection): Scores => {
    return {
        getScoreByName: async (name: string) => {
            if (CheckName(name)) {
                const collection = db.connection().collection('scores');
                return collection.findOne({name: name});
            } else {

            }
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name: string, score: number) => {
            if (CheckName(name) && CheckScore(score)) {
                return db.connection().collection('scores').insertOne({name: name, score: score},
                    (err: any, result: any) => {
                        if(err){
                            return console.log(err);
                        }
                        console.log(result.ops);
                    });
            } else {

            }
        }
    };
}
