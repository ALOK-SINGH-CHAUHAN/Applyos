"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Create;
const react_redux_1 = require("react-redux");
const store_1 = require("lib/redux/store");
const ResumeForm_1 = require("components/ResumeForm");
const Resume_1 = require("components/Resume");
function Create() {
    return (<react_redux_1.Provider store={store_1.store}>
      <main className="relative h-full w-full overflow-hidden bg-gray-50">
        <div className="grid grid-cols-3 md:grid-cols-6">
          <div className="col-span-3">
            <ResumeForm_1.ResumeForm />
          </div>
          <div className="col-span-3">
            <Resume_1.Resume />
          </div>
        </div>
      </main>
    </react_redux_1.Provider>);
}
