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
exports.FeaturedSkillInput = void 0;
const react_1 = __importStar(require("react"));
const InputGroup_1 = require("components/ResumeForm/Form/InputGroup");
const FeaturedSkillInput = ({ skill, rating, setSkillRating, placeholder, className, circleColor, }) => {
    return (<div className={`flex ${className}`}>
      <input type="text" value={skill} placeholder={placeholder} onChange={(e) => setSkillRating(e.target.value, rating)} className={InputGroup_1.INPUT_CLASS_NAME}/>
      <CircleRating rating={rating} setRating={(newRating) => setSkillRating(skill, newRating)} circleColor={circleColor}/>
    </div>);
};
exports.FeaturedSkillInput = FeaturedSkillInput;
const CircleRating = ({ rating, setRating, circleColor = "#38bdf8", }) => {
    const numCircles = 5;
    const [hoverRating, setHoverRating] = (0, react_1.useState)(null);
    return (<div className="flex items-center p-2">
      {[...Array(numCircles)].map((_, idx) => (<div className={`cursor-pointer p-0.5`} key={idx} onClick={() => setRating(idx)} onMouseEnter={() => setHoverRating(idx)} onMouseLeave={() => setHoverRating(null)}>
          <div className="h-5 w-5 rounded-full transition-transform duration-200 hover:scale-[120%] " style={{
                backgroundColor: (hoverRating !== null && hoverRating >= idx) ||
                    (hoverRating === null && rating >= idx)
                    ? circleColor
                    : "#d1d5db", //gray-300
            }}/>
        </div>))}
    </div>);
};
