'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBScores = void 0;
const queries = require("./Queries");
const InputValidator_1 = require("./InputValidator");
const DBScores = (db) => {
    return {
        getScoreByName: async (name) => {
            if (InputValidator_1.CheckName(name)) {
                return db.connection()
                    .query(queries.getScoreByName(name))
                    .then((result) => result.rows)
                    .catch((err) => console.log(err));
            }
            else {
            }
        },
        getScores: async () => {
            return db.connection()
                .query(queries.getScores())
                .then((result) => result.rows)
                .catch((err) => console.log(err));
        },
        uploadScore: async (name, score) => {
            if (InputValidator_1.CheckName(name) && InputValidator_1.CheckScore(score)) {
                return db.connection()
                    .query(queries.uploadScore(name, score))
                    .catch((err) => console.log(err));
            }
            else {
            }
        }
    };
};
exports.DBScores = DBScores;
//# sourceMappingURL=ScoresPostgres.js.map