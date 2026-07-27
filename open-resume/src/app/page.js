"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const Hero_1 = require("home/Hero");
const Steps_1 = require("home/Steps");
const Features_1 = require("home/Features");
const Testimonials_1 = require("home/Testimonials");
const QuestionsAndAnswers_1 = require("home/QuestionsAndAnswers");
function Home() {
    return (<main className="mx-auto max-w-screen-2xl bg-dot px-8 pb-32 text-gray-900 lg:px-12">
      <Hero_1.Hero />
      <Steps_1.Steps />
      <Features_1.Features />
      <Testimonials_1.Testimonials />
      <QuestionsAndAnswers_1.QuestionsAndAnswers />
    </main>);
}
