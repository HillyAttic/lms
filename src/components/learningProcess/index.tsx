"use client";

import SectionTitle from "../sectionTitle";
import Reveal from "../ui/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

/*
 * Timeline accordion. Content describes what the platform actually does —
 * repository launch, SCORM progress tracking, `/dashboard/certificates`.
 */
const steps = [
  {
    id: "step-1",
    title: "Choose your course",
    body: "Browse the full library by format — SCORM modules, video courses or games — and filter by level to find the right starting point.",
  },
  {
    id: "step-2",
    title: "Learn at your own pace",
    body: "Courses are self-paced and resume where you left off. Your progress is saved to your account as you go, so nothing is lost between sessions.",
  },
  {
    id: "step-3",
    title: "Practise on real work",
    body: "Interactive modules and project work replace passive watching. You build the thing rather than read about it.",
  },
  {
    id: "step-4",
    title: "Complete your assessments",
    body: "SCORM courses report scores and completion back to the platform, so your record is always up to date.",
  },
  {
    id: "step-5",
    title: "Earn your certificate",
    body: "Finish a course and your certificate is issued to your dashboard, ready to download and share.",
  },
  {
    id: "step-6",
    title: "Build your career",
    body: "Track completed courses and certificates in one place, and keep your profile current as you go.",
  },
];

const LearningProcess = () => {
  return (
    <section className="border-t-[1.5px] border-ink py-16 sm:py-20 lg:py-28">
      <div className="container">
        <SectionTitle
          subTitle="The process"
          description="Six steps from picking a course to holding a certificate."
        >
          How learning <span className="marker">works</span>
        </SectionTitle>

        <Reveal className="mt-12 sm:mt-14">
          <Accordion type="single" collapsible defaultValue="step-1">
            <ul className="border-t-[1.5px] border-ink">
              {steps.map((step, i) => (
                <li key={step.id}>
                  <AccordionItem value={step.id}>
                    <AccordionTrigger>
                      <span className="flex items-baseline gap-4 sm:gap-8">
                        <span className="text-sm font-bold text-secondary tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {step.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="sm:pl-14">{step.body}</p>
                    </AccordionContent>
                  </AccordionItem>
                </li>
              ))}
            </ul>
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
};

export default LearningProcess;
