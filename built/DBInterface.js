'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoresMongo = exports.ScoresPostgres = void 0;
const getScoreByName = (name) => `select score from scores where name = \'${name}\';`;
const getScores = () => 'select name, score from scores;';
const uploadScore = (name, score) => `insert into scores (name, score) VALUES (\'${name}\', ${score})`;
const ScoresPostgres = (db) => {
    return {
        getScoreByName: async (name) => {
            return db.connection()
                .query(getScoreByName(name))
                .then((result) => result)
                .catch((err) => console.log(err));
        },
        getScores: async () => {
            return db.connection()
                .query(getScores())
                .then((result) => result)
                .catch((err) => console.log(err));
        },
        uploadScore: async (name, score) => {
            return db.connection()
                .query(uploadScore(name, score))
                .catch((err) => console.log(err));
        }
    };
};
exports.ScoresPostgres = ScoresPostgres;
const ScoresMongo = (db) => {
    return {
        getScoreByName: async (name) => {
            const collection = db.connection().collection('scores');
            return collection.findOne({ name: name }).toArray();
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray((err, results) => results);
        },
        uploadScore: async (name, score) => {
            return db.connection().insertOne({ name: name, score: score }, (err, result) => {
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