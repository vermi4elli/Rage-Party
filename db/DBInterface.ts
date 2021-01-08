'use strict';

export type Score = { score: number, name: string }

export type Scores = {
    getScoreByName: (name: string) => Promise<Score[] | { error: string }>,
    getScores: () => Promise<Score[] | { error : string }>,
    uploadScore: (name: string, score: number) => void
};
