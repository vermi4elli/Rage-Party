'use strict';

export type Score = Record<string, number>

export type Scores = {
    getScoreByName: (name: string) => Promise<Score>,
    getScores: () => Promise<Score>,
    uploadScore: (name: string, score: number) => void
};
