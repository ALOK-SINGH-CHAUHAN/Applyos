"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopNavBar = void 0;
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const image_1 = __importDefault(require("next/image"));
const logo_svg_1 = __importDefault(require("public/logo.svg"));
const cx_1 = require("lib/cx");
const TopNavBar = () => {
    const pathName = (0, navigation_1.usePathname)();
    const isHomePage = pathName === "/";
    return (<header aria-label="Site Header" className={(0, cx_1.cx)("flex h-[var(--top-nav-bar-height)] items-center border-b-2 border-gray-100 px-3 lg:px-12", isHomePage && "bg-dot")}>
      <div className="flex h-10 w-full items-center justify-between">
        <link_1.default href="/">
          <span className="sr-only">OpenResume</span>
          <image_1.default src={logo_svg_1.default} alt="OpenResume Logo" className="h-8 w-full" priority/>
        </link_1.default>
        <nav aria-label="Site Nav Bar" className="flex items-center gap-2 text-sm font-medium">
          {[
            ["/resume-builder", "Builder"],
            ["/resume-parser", "Parser"],
        ].map(([href, text]) => (<link_1.default key={text} className="rounded-md px-1.5 py-2 text-gray-500 hover:bg-gray-100 focus-visible:bg-gray-100 lg:px-4" href={href}>
              {text}
            </link_1.default>))}
          <div className="ml-1 mt-1">
            <iframe src="https://ghbtns.com/github-btn.html?user=xitanggg&repo=open-resume&type=star&count=true" width="100" height="20" className="overflow-hidden border-none" title="GitHub"/>
          </div>
        </nav>
      </div>
    </header>);
};
exports.TopNavBar = TopNavBar;
