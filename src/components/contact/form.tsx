"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import { MailAltFill, Telephone, Globe } from "@/lib/icons";
import { sendContactMessage, type ContactFormState } from "@/app/actions/contact-actions";

const details = [
  { icon: <MailAltFill />, label: "Email", value: "support@edventurehub.com", href: "mailto:support@edventurehub.com" },
  { icon: <Telephone />, label: "Call us", value: "+1 (555) 012-3456" },
  { icon: <Globe />, label: "Office hours", value: "Mon–Fri, 9am–6pm" },
];

const ContactForm = () => {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    sendContactMessage,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Thanks — your message is on its way.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <section className="py-12 sm:py-16">
      <div className="container grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          ref={formRef}
          action={action}
          className="card-brutal bg-white p-6 sm:p-8"
        >
          <h2 className="display-3">Send us a message</h2>
          <p className="mt-3 text-sm text-secondary">
            Fill in the form and our team will reply within one business day.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-2 block font-semibold">Name</span>
              <Input name="name" required maxLength={100} placeholder="Your name" />
            </label>
            <label className="block text-sm">
              <span className="mb-2 block font-semibold">Email</span>
              <Input name="email" type="email" required maxLength={200} placeholder="you@example.com" />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="mb-2 block font-semibold">Subject</span>
            <Input name="subject" maxLength={150} placeholder="How can we help?" />
          </label>

          <label className="mt-4 block text-sm">
            <span className="mb-2 block font-semibold">Message</span>
            <Textarea name="message" required maxLength={5000} placeholder="Tell us a bit more…" />
          </label>

          <Button type="submit" variant="accent" size="lg" disabled={pending} className="mt-6 max-sm:w-full">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>

        <aside className="flex flex-col gap-4">
          {details.map(({ icon, label, value, href }) => (
            <div
              key={label}
              className="card-brutal flex items-start gap-4 bg-white p-6"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-accent text-ink">
                {icon}
              </span>
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">
                  {label}
                </p>
                {href ? (
                  <a
                    href={href}
                    className="mt-1 block font-semibold underline-offset-4 hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">{value}</p>
                )}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </section>
  );
};

export default ContactForm;
