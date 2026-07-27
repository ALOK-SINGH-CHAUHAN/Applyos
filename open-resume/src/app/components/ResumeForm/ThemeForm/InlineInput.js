"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineInput = void 0;
const InlineInput = ({ label, labelClassName, name, value = "", placeholder, inputStyle = {}, onChange, }) => {
    return (<label className={`flex gap-2 text-base font-medium text-gray-700 ${labelClassName}`}>
      <span className="w-28">{label}</span>
      <input type="text" name={name} value={value} placeholder={placeholder} onChange={(e) => onChange(name, e.target.value)} className="w-[5rem] border-b border-gray-300 text-center font-semibold leading-3 outline-none" style={inputStyle}/>
    </label>);
};
exports.InlineInput = InlineInput;
