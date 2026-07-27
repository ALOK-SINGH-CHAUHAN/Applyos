"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogoCloud = void 0;
const logo_cornell_svg_1 = __importDefault(require("public/assets/logo-cornell.svg"));
const logo_columbia_svg_1 = __importDefault(require("public/assets/logo-columbia.svg"));
const logo_northeastern_svg_1 = __importDefault(require("public/assets/logo-northeastern.svg"));
const logo_dropbox_svg_1 = __importDefault(require("public/assets/logo-dropbox.svg"));
const logo_google_svg_1 = __importDefault(require("public/assets/logo-google.svg"));
const logo_amazon_svg_1 = __importDefault(require("public/assets/logo-amazon.svg"));
const image_1 = __importDefault(require("next/image"));
const LOGOS = [
    { src: logo_cornell_svg_1.default, alt: "Cornell University logo" },
    { src: logo_columbia_svg_1.default, alt: "Columbia University logo" },
    { src: logo_northeastern_svg_1.default, alt: "Northeastern University logo" },
    { src: logo_dropbox_svg_1.default, alt: "Dropbox logo" },
    { src: logo_google_svg_1.default, alt: "Google logo" },
    { src: logo_amazon_svg_1.default, alt: "Amazon logo" },
];
// LogoCloud is disabled per issue: https://github.com/xitanggg/open-resume/issues/7
const LogoCloud = () => (<section className="mt-14 lg:mt-10">
    <h2 className="text-center font-semibold text-gray-500">
      Trusted by students and employees from top universities and companies
      worldwide
    </h2>
    <div className="mt-6 grid grid-cols-6 items-center justify-items-center gap-x-8 gap-y-10">
      {LOGOS.map(({ src, alt }, idx) => (<image_1.default key={idx} className="col-span-3 h-full max-h-10 max-w-[130px] lg:col-span-1 lg:max-w-[160px]" src={src} alt={alt}/>))}
    </div>
  </section>);
exports.LogoCloud = LogoCloud;
