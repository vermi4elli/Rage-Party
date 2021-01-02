'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadScore = exports.getScores = exports.getScoreByName = void 0;
const getScoreByName = (name) => `select name, score from scores where name = \'${name}\';`;
exports.getScoreByName = getScoreByName;
const getScores = () => 'select name, score from scores;';
exports.getScores = getScores;
const uploadScore = (name, score) => `insert into scores (name, score) VALUES (\'${name}\', ${score})`;
exports.uploadScore = uploadScore;
//# sourceMappingURL=Queries.js.map