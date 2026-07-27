export declare const dropdownHtml = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>Core Dropdown Fixture</title>\n    <style>\n      body { font-family: sans-serif; margin: 0; padding: 24px; }\n      #app { max-width: 640px; }\n      #menu { display: none; margin-top: 8px; padding: 8px 16px; border: 1px solid #ccc; }\n      #menu.open { display: block; }\n      #hover-status { margin-top: 12px; color: #444; }\n      input { margin-top: 16px; width: 240px; padding: 8px; }\n    </style>\n  </head>\n  <body>\n    <div id=\"app\">\n      <div>\n        <button id=\"dropdown-button\" type=\"button\" aria-expanded=\"false\">Open Menu</button>\n        <ul id=\"menu\" aria-hidden=\"true\">\n          <li>Alpha</li>\n          <li>Beta</li>\n          <li>Gamma</li>\n        </ul>\n      </div>\n      <p id=\"hover-status\">idle</p>\n      <input id=\"fixture-input\" type=\"text\" value=\"\" />\n    </div>\n    <script>\n      const button = document.getElementById(\"dropdown-button\");\n      const menu = document.getElementById(\"menu\");\n      const hoverStatus = document.getElementById(\"hover-status\");\n      button.addEventListener(\"mouseenter\", () => {\n        hoverStatus.textContent = \"hovered\";\n      });\n      button.addEventListener(\"mouseleave\", () => {\n        hoverStatus.textContent = \"idle\";\n      });\n      button.addEventListener(\"click\", () => {\n        const open = menu.classList.toggle(\"open\");\n        button.setAttribute(\"aria-expanded\", open ? \"true\" : \"false\");\n        menu.setAttribute(\"aria-hidden\", open ? \"false\" : \"true\");\n      });\n    </script>\n  </body>\n</html>";
export declare const resistorHtml = "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>Core Resistor Fixture</title>\n    <style>\n      body { font-family: sans-serif; margin: 0; }\n      header { position: sticky; top: 0; background: #fff; padding: 16px; border-bottom: 1px solid #ddd; }\n      main { padding: 24px; }\n      .spacer { height: 2400px; background: linear-gradient(180deg, #fafafa, #e9e9e9); }\n    </style>\n  </head>\n  <body>\n    <header>Resistor Reference</header>\n    <main>\n      <h1>Resistor Color Codes</h1>\n      <p>Scroll to exercise viewport movement.</p>\n      <div class=\"spacer\"></div>\n    </main>\n  </body>\n</html>";
export declare const coreFixtureRoutes: readonly [{
    readonly path: "/dropdown";
    readonly html: "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>Core Dropdown Fixture</title>\n    <style>\n      body { font-family: sans-serif; margin: 0; padding: 24px; }\n      #app { max-width: 640px; }\n      #menu { display: none; margin-top: 8px; padding: 8px 16px; border: 1px solid #ccc; }\n      #menu.open { display: block; }\n      #hover-status { margin-top: 12px; color: #444; }\n      input { margin-top: 16px; width: 240px; padding: 8px; }\n    </style>\n  </head>\n  <body>\n    <div id=\"app\">\n      <div>\n        <button id=\"dropdown-button\" type=\"button\" aria-expanded=\"false\">Open Menu</button>\n        <ul id=\"menu\" aria-hidden=\"true\">\n          <li>Alpha</li>\n          <li>Beta</li>\n          <li>Gamma</li>\n        </ul>\n      </div>\n      <p id=\"hover-status\">idle</p>\n      <input id=\"fixture-input\" type=\"text\" value=\"\" />\n    </div>\n    <script>\n      const button = document.getElementById(\"dropdown-button\");\n      const menu = document.getElementById(\"menu\");\n      const hoverStatus = document.getElementById(\"hover-status\");\n      button.addEventListener(\"mouseenter\", () => {\n        hoverStatus.textContent = \"hovered\";\n      });\n      button.addEventListener(\"mouseleave\", () => {\n        hoverStatus.textContent = \"idle\";\n      });\n      button.addEventListener(\"click\", () => {\n        const open = menu.classList.toggle(\"open\");\n        button.setAttribute(\"aria-expanded\", open ? \"true\" : \"false\");\n        menu.setAttribute(\"aria-hidden\", open ? \"false\" : \"true\");\n      });\n    </script>\n  </body>\n</html>";
}, {
    readonly path: "/resistor";
    readonly html: "<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <title>Core Resistor Fixture</title>\n    <style>\n      body { font-family: sans-serif; margin: 0; }\n      header { position: sticky; top: 0; background: #fff; padding: 16px; border-bottom: 1px solid #ddd; }\n      main { padding: 24px; }\n      .spacer { height: 2400px; background: linear-gradient(180deg, #fafafa, #e9e9e9); }\n    </style>\n  </head>\n  <body>\n    <header>Resistor Reference</header>\n    <main>\n      <h1>Resistor Color Codes</h1>\n      <p>Scroll to exercise viewport movement.</p>\n      <div class=\"spacer\"></div>\n    </main>\n  </body>\n</html>";
}];
export declare const dropdownFixture: {
    readonly url: string;
    selectors: {
        readonly button: "#dropdown-button";
        readonly menu: "#menu";
        readonly hoverStatus: "#hover-status";
        readonly input: "#fixture-input";
    };
    targets: {
        readonly button: {
            readonly kind: "selector";
            readonly value: "#dropdown-button";
        };
        readonly menu: {
            readonly kind: "selector";
            readonly value: "#menu";
        };
        readonly hoverStatus: {
            readonly kind: "selector";
            readonly value: "#hover-status";
        };
        readonly input: {
            readonly kind: "selector";
            readonly value: "#fixture-input";
        };
    };
    expected: {
        title: string;
        buttonText: string;
        hoverStatus: string;
    };
};
export declare const resistorFixture: {
    readonly url: string;
    selectors: {
        readonly header: "header";
        readonly heading: "h1";
    };
    expected: {
        title: string;
        headingText: string;
    };
};
