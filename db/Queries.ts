'use strict';

export const getScoreByName = (name: string) => {
    return {
        text: 'select name, score from scores where name = $1',
        values: [name]
    };
};
export const getScores = () => 'select name, score from scores order by score desc;';
export const uploadScore = (name: string, score: number) => {
    return {
        text: 'insert into scores (name, score) VALUES ($1, $2)',
        values: [name, score]
    };
};
