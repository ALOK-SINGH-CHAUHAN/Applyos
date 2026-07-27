"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = void 0;
const cx_1 = require("lib/cx");
const Table = ({ table, title, className, trClassNames = [], tdClassNames = [], }) => {
    const tableHeader = table[0];
    const tableBody = table.slice(1);
    return (<table className={(0, cx_1.cx)("w-full divide-y border text-sm text-gray-900", className)}>
      <thead className="divide-y bg-gray-50 text-left align-top">
        {title && (<tr className="divide-x bg-gray-50">
            <th className="px-2 py-1.5 font-bold" scope="colSpan" colSpan={tableHeader.length}>
              {title}
            </th>
          </tr>)}
        <tr className="divide-x bg-gray-50">
          {tableHeader.map((item, idx) => (<th className="px-2 py-1.5 font-semibold" scope="col" key={idx}>
              {item}
            </th>))}
        </tr>
      </thead>
      <tbody className="divide-y text-left align-top">
        {tableBody.map((row, rowIdx) => (<tr className={(0, cx_1.cx)("divide-x", trClassNames[rowIdx])} key={rowIdx}>
            {row.map((item, colIdx) => (<td className={(0, cx_1.cx)("px-2 py-1.5", tdClassNames[colIdx])} key={colIdx}>
                {item}
              </td>))}
          </tr>))}
      </tbody>
    </table>);
};
exports.Table = Table;
