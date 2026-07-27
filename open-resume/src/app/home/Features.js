"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Features = void 0;
const image_1 = __importDefault(require("next/image"));
const feature_free_svg_1 = __importDefault(require("public/assets/feature-free.svg"));
const feature_us_svg_1 = __importDefault(require("public/assets/feature-us.svg"));
const feature_privacy_svg_1 = __importDefault(require("public/assets/feature-privacy.svg"));
const feature_open_source_svg_1 = __importDefault(require("public/assets/feature-open-source.svg"));
const documentation_1 = require("components/documentation");
const FEATURES = [
    {
        src: feature_free_svg_1.default,
        title: "Free Forever",
        text: "OpenResume is created with the belief that everyone should have free and easy access to a modern professional resume design",
    },
    {
        src: feature_us_svg_1.default,
        title: "U.S. Best Practices",
        text: "OpenResume has built-in best practices for the U.S. job market and works well with top ATS platforms such as Greenhouse and Lever",
    },
    {
        src: feature_privacy_svg_1.default,
        title: "Privacy Focus",
        text: "OpenResume stores data locally in your browser so only you have access to your data and with complete control",
    },
    {
        src: feature_open_source_svg_1.default,
        title: "Open-Source",
        text: (<>
        OpenResume is an open-source project, and its source code can be viewed
        by anyone on its{" "}
        <documentation_1.Link href="https://github.com/xitanggg/open-resume">
          GitHub repository
        </documentation_1.Link>
      </>),
    },
];
const Features = () => {
    return (<section className="py-16 lg:py-36">
      <div className="mx-auto lg:max-w-4xl">
        <dl className="grid grid-cols-1 justify-items-center gap-y-8 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-16">
          {FEATURES.map(({ src, title, text }) => (<div className="px-2" key={title}>
              <div className="relative w-96 self-center pl-16">
                <dt className="text-2xl font-bold">
                  <image_1.default src={src} className="absolute left-0 top-1 h-12 w-12" alt="Feature icon"/>
                  {title}
                </dt>
                <dd className="mt-2">{text}</dd>
              </div>
            </div>))}
        </dl>
      </div>
    </section>);
};
exports.Features = Features;
