"use client";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Testimonials = void 0;
const heart_svg_1 = __importDefault(require("public/assets/heart.svg"));
const testimonial_spiegel_jpg_1 = __importDefault(require("public/assets/testimonial-spiegel.jpg"));
const testimonial_santi_jpg_1 = __importDefault(require("public/assets/testimonial-santi.jpg"));
const testimonial_vivian_jpg_1 = __importDefault(require("public/assets/testimonial-vivian.jpg"));
const react_1 = __importStar(require("react"));
const image_1 = __importDefault(require("next/image"));
const useTailwindBreakpoints_1 = require("lib/hooks/useTailwindBreakpoints");
const TESTIMONIALS = [
    {
        src: testimonial_spiegel_jpg_1.default,
        quote: "Students often make silly mistakes on their resume by using inconsistent bullet points or font sizes. OpenResume’s auto format feature is a great help to ensure consistent format.",
        name: "Ms. Spiegel",
        title: "Educator",
    },
    {
        src: testimonial_santi_jpg_1.default,
        quote: "I used OpenResume during my last job search and was invited to interview at top tech companies such as Google and Amazon thanks to its slick yet professional resume design.",
        name: "Santi",
        title: "Software Engineer",
    },
    {
        src: testimonial_vivian_jpg_1.default,
        quote: "Creating a professional resume on OpenResume is so smooth and easy! It saves me so much time and headache to not deal with google doc template.",
        name: "Vivian",
        title: "College Student",
    },
];
const LG_TESTIMONIALS_CLASSNAMES = [
    "z-10",
    "translate-x-44 translate-y-24 opacity-40",
    "translate-x-32 -translate-y-28 opacity-40",
];
const SM_TESTIMONIALS_CLASSNAMES = ["z-10", "opacity-0", "opacity-0"];
const ROTATION_INTERVAL_MS = 8 * 1000; // 8s
const Testimonials = ({ children }) => {
    const [testimonialsClassNames, setTestimonialsClassNames] = (0, react_1.useState)(LG_TESTIMONIALS_CLASSNAMES);
    const isHoveredOnTestimonial = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(() => {
        const intervalId = setInterval(() => {
            if (!isHoveredOnTestimonial.current) {
                setTestimonialsClassNames((preClassNames) => {
                    return [preClassNames[1], preClassNames[2], preClassNames[0]];
                });
            }
        }, ROTATION_INTERVAL_MS);
        return () => clearInterval(intervalId);
    }, []);
    const { isLg } = (0, useTailwindBreakpoints_1.useTailwindBreakpoints)();
    (0, react_1.useEffect)(() => {
        setTestimonialsClassNames(isLg ? LG_TESTIMONIALS_CLASSNAMES : SM_TESTIMONIALS_CLASSNAMES);
    }, [isLg]);
    return (<section className="mx-auto -mt-2 px-8 pb-24">
      <h2 className="mb-8 text-center text-3xl font-bold">
        People{" "}
        <image_1.default src={heart_svg_1.default} alt="love" className="-mt-1 inline-block w-7"/>{" "}
        OpenResume
      </h2>
      <div className="mx-auto mt-10 h-[235px] max-w-lg lg:h-[400px] lg:pt-28">
        <div className="relative lg:ml-[-50px]">
          {TESTIMONIALS.map(({ src, quote, name, title }, idx) => {
            const className = testimonialsClassNames[idx];
            return (<div key={idx} className={`bg-primary absolute max-w-lg rounded-[1.7rem] bg-opacity-30 shadow-md transition-all duration-1000 ease-linear ${className}`} onMouseEnter={() => {
                    if (className === "z-10") {
                        isHoveredOnTestimonial.current = true;
                    }
                }} onMouseLeave={() => {
                    if (className === "z-10") {
                        isHoveredOnTestimonial.current = false;
                    }
                }}>
                <figure className="m-1 flex gap-5 rounded-3xl bg-white p-5 text-gray-900 lg:p-7">
                  <image_1.default className="hidden h-24 w-24 select-none rounded-full lg:block" src={src} alt="profile"/>
                  <div>
                    <blockquote>
                      <p className="before:content-['“'] after:content-['”']">
                        {quote}
                      </p>
                    </blockquote>
                    <figcaption className="mt-3">
                      <div className="hidden gap-2 lg:flex">
                        <div className="font-semibold">{name}</div>
                        <div className="select-none text-gray-700" aria-hidden="true">
                          •
                        </div>
                        <div className="text-gray-600">{title}</div>
                      </div>
                      <div className="flex gap-4 lg:hidden">
                        <image_1.default className=" block h-12 w-12 select-none rounded-full" src={src} alt="profile"/>
                        <div>
                          <div className="font-semibold">{name}</div>
                          <div className="text-gray-600">{title}</div>
                        </div>
                      </div>
                    </figcaption>
                  </div>
                </figure>
              </div>);
        })}
        </div>
      </div>
      {children}
    </section>);
};
exports.Testimonials = Testimonials;
