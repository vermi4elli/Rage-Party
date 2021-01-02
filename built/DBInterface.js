'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoresMongo = exports.ScoresPostgres = void 0;
const queries = require("./Queries");
const ScoresPostgres = (db) => {
    return {
        getScoreByName: async (name) => {
            return db.connection()
                .query(queries.getScoreByName(name))
                .then((result) => result)
                .catch((err) => console.log(err));
        },
        getScores: async () => {
            return db.connection()
                .query(queries.getScores())
                .then((result) => result)
                .catch((err) => console.log(err));
        },
        uploadScore: async (name, score) => {
            return db.connection()
                .query(queries.uploadScore(name, score))
                .catch((err) => console.log(err));
        }
    };
};
exports.ScoresPostgres = ScoresPostgres;
const ScoresMongo = (db) => {
    return {
        getScoreByName: async (name) => {
            const collection = db.connection().collection('scores');
            return collection.findOne({ name: name });
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name, score) => {
            return db.connection().collection('scores').insertOne({ name: name, score: score }, (err, result) => {
                if (err) {
                    return console.log(err);
                }
                console.log(result.ops);
            });
        }
    };
};
exports.ScoresMongo = ScoresMongo;
//# sourceMappingURL=DBInterface.js.map