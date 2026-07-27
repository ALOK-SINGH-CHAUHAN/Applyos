"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hero = void 0;
const link_1 = __importDefault(require("next/link"));
const FlexboxSpacer_1 = require("components/FlexboxSpacer");
const AutoTypingResume_1 = require("home/AutoTypingResume");
const Hero = () => {
    return (<section className="lg:flex lg:h-[825px] lg:justify-center">
      <FlexboxSpacer_1.FlexboxSpacer maxWidth={75} minWidth={0} className="hidden lg:block"/>
      <div className="mx-auto max-w-xl pt-8 text-center lg:mx-0 lg:grow lg:pt-32 lg:text-left">
        <h1 className="text-primary pb-2 text-4xl font-bold lg:text-5xl">
          Create a professional
          <br />
          resume easily
        </h1>
        <p className="mt-3 text-lg lg:mt-5 lg:text-xl">
          With this free, open-source, and powerful resume builder
        </p>
        <link_1.default href="/resume-import" className="btn-primary mt-6 lg:mt-14">
          Create Resume <span aria-hidden="true">→</span>
        </link_1.default>
        <p className="ml-6 mt-3 text-sm text-gray-600">No sign up required</p>
        <p className="mt-3 text-sm text-gray-600 lg:mt-36">
          Already have a resume? Test its ATS readability with the{" "}
          <link_1.default href="/resume-parser" className="underline underline-offset-2">
            resume parser
          </link_1.default>
        </p>
      </div>
      <FlexboxSpacer_1.FlexboxSpacer maxWidth={100} minWidth={50} className="hidden lg:block"/>
      <div className="mt-6 flex justify-center lg:mt-4 lg:block lg:grow">
        <AutoTypingResume_1.AutoTypingResume />
      </div>
    </section>);
};
exports.Hero = Hero;
