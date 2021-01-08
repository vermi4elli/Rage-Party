'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBScores = void 0;
const InputValidator_1 = require("./InputValidator");
const DBScores = (db) => {
    return {
        getScoreByName: async (name) => {
            const collection = db.connection().collection('scores');
            return InputValidator_1.CheckName(name) ? collection.findOne({ name: name }) : {};
        },
        getScores: async () => {
            const collection = db.connection().collection('scores');
            return collection.find().toArray();
        },
        uploadScore: async (name, score) => {
            return (InputValidator_1.CheckName(name) && InputValidator_1.CheckScore(score)) ? db.connection().collection('scores').insertOne({ name: name, score: score }, (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(result.ops);
                result.ops;
            }) : {};
        }
    };
};
exports.DBScores = DBScores;
//# sourceMappingURL=ScoresMongo.js.map