'use strict';

export const getScoreByName = (name: string) => `select name, score from scores where name = \'${name}\';`;
export const getScores = () => 'select name, score from scores;';
export const uploadScore = (name: string, score: number) => `insert into scores (name, score) VALUES (\'${name}\', ${score})`;
