'use strict';

export const CheckName = (name: string) => {
    return /[a-zA-Z0-9]+/.test(name) &&
        !/[^a-zA-Z0-9]/.test(name);
}

export const CheckScore = (score: number) => {
    return /[0-9]+/.test(score.toString()) &&
    !/[^0-9]+/.test(score.toString());
}
