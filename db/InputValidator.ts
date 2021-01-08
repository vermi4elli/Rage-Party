'use strict';

export const CheckName = (name: string): boolean => {
    return /[a-zA-Z_ 0-9]+/.test(name) &&
        !/[^a-zA-Z_ 0-9]+/.test(name);
}

export const CheckScore = (score: number): boolean => {
    return /[0-9]+/.test(score.toString()) &&
    !/[^0-9]+/.test(score.toString());
}
