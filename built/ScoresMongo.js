'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBScores = void 0;
const InputValidator_1 = require("./InputValidator");
const DBScores = (db) => {
    return {
        getScoreByName: async (name) => {
            if (InputValidator_1.CheckName(name)) {
                const collection = db.connection().collection('scores');
                return collection.findOne({ name: name });
            }
            else {
            }
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name, score) => {
            if (InputValidator_1.CheckName(name) && InputValidator_1.CheckScore(score)) {
                return db.connection().collection('scores').insertOne({ name: name, score: score }, (err, result) => {
                    if (err) {
                        return console.log(err);
                    }
                    console.log(result.ops);
                });
            }
            else {
            }
        }
    };
};
exports.DBScores = DBScores;
//# sourceMappingURL=ScoresMongo.js.map