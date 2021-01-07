'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckScore = exports.CheckName = void 0;
const CheckName = (name) => {
    return /[a-zA-Z0-9]+/.test(name) &&
        !/[^a-zA-Z0-9]/.test(name);
};
exports.CheckName = CheckName;
const CheckScore = (score) => {
    return /[0-9]+/.test(score.toString()) &&
        !/[^0-9]+/.test(score.toString());
};
exports.CheckScore = CheckScore;
//# sourceMappingURL=InputValidator.js.map