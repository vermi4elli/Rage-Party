'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScore = exports.getScores = exports.getScoreByName = void 0;
const getScoreByName = (name) => {
    return {
        text: 'select name, score from scores where name = $1',
        values: [name]
    };
};
exports.getScoreByName = getScoreByName;
const getScores = () => 'select name, score from scores;';
exports.getScores = getScores;
const uploadScore = (name, score) => {
    return {
        text: 'insert into scores (name, score) VALUES ($1, $2)',
        values: [name, score]
    };
};
exports.uploadScore = uploadScore;
//# sourceMappingURL=Queries.js.map