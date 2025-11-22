"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.surrender = exports.useSpecial = exports.lockCard = exports.createGame = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialiser Firebase Admin
admin.initializeApp();
// Exports des fonctions
var createGame_1 = require("./createGame");
Object.defineProperty(exports, "createGame", { enumerable: true, get: function () { return createGame_1.createGame; } });
var lockCard_1 = require("./lockCard");
Object.defineProperty(exports, "lockCard", { enumerable: true, get: function () { return lockCard_1.lockCard; } });
var useSpecial_1 = require("./useSpecial");
Object.defineProperty(exports, "useSpecial", { enumerable: true, get: function () { return useSpecial_1.useSpecial; } });
var surrender_1 = require("./surrender");
Object.defineProperty(exports, "surrender", { enumerable: true, get: function () { return surrender_1.surrender; } });
// Scheduled functions désactivées (problèmes de syntaxe + coût)
// export { updateRapidTimer } from './updateRapidTimer';
// export { checkInactivity } from './checkInactivity';
//# sourceMappingURL=index.js.map