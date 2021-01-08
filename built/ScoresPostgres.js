'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBScores = void 0;
const queries = require("./Queries");
const InputValidator_1 = require("./InputValidator");
const DBScores = (db) => {
    return {
        getScoreByName: async (name) => {
            return InputValidator_1.CheckName(name) ?
                db.connection().connect().then((client) => {
                    const result = client.query(queries.getScoreByName(name))
                        .then((result) => {
                        return result.rows;
                    })
                        .catch((err) => {
                        return { error: err.message };
                    });
                    client.release();
                    return result;
                }) : { error: 'name is not correct' };
        },
        getScores: async () => {
            return db.connection().connect().then((client) => {
                const result = client
                    .query(queries.getScores())
                    .then((result) => {
                    return result.rows;
                })
                    .catch((err) => {
                    return { error: err.message };
                });
                client.release();
                return result;
            });
        },
        uploadScore: async (name, score) => {
            return (InputValidator_1.CheckName(name) && InputValidator_1.CheckScore(score)) ?
                db.connection().connect().then((client) => {
                    const result = client
                        .query(queries.uploadScore(name, score))
                        .then((result) => {
                        return result;
                    })
                        .catch((err) => {
                        return { error: err.message };
                    });
                    client.release();
                    return result;
                }) :
                { error: 'the data is not correct' };
        }
    };
};
exports.DBScores = DBScores;
//# sourceMappingURL=ScoresPostgres.js.map