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
    <section className="bg-gray-50 py-12 sm:py-16">
      <div className="container grid gap-8 lg:grid-cols-[1fr_360px]">
        <form
          ref={formRef}
          action={action}
          className="rounded-3xl bg-primary p-6 shadow-xs sm:p-8"
        >
          <h2 className="text-2xl font-semibold tracking-[-0.48px]">Send us a message</h2>
          <p className="mt-2 text-sm tracking-sm text-secondary">
            Fill in the form and our team will reply within one business day.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm tracking-sm">
              <span className="mb-2 block font-medium">Name</span>
              <Input name="name" required maxLength={100} placeholder="Your name" />
            </label>
            <label className="block text-sm tracking-sm">
              <span className="mb-2 block font-medium">Email</span>
              <Input name="email" type="email" required maxLength={200} placeholder="you@example.com" />
            </label>
          </div>

          <label className="mt-4 block text-sm tracking-sm">
            <span className="mb-2 block font-medium">Subject</span>
            <Input name="subject" maxLength={150} placeholder="How can we help?" />
          </label>

          <label className="mt-4 block text-sm tracking-sm">
            <span className="mb-2 block font-medium">Message</span>
            <Textarea name="message" required maxLength={5000} placeholder="Tell us a bit more…" />
          </label>

          <Button type="submit" size="lg" disabled={pending} className="mt-6 max-sm:w-full">
            {pending ? "Sending…" : "Send Message"}
          </Button>
        </form>

        <aside className="flex flex-col gap-4">
          {details.map(({ icon, label, value, href }) => (
            <div
              key={label}
              className="flex items-start gap-4 rounded-3xl bg-primary p-6 shadow-xs"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-500">
                {icon}
              </span>
              <div>
                <p className="text-sm tracking-sm text-secondary">{label}</p>
                {href ? (
                  <a href={href} className="mt-1 block font-medium hover:text-purple-500">
                    {value}
                  </a>
                ) : (
                  <p className="mt-1 font-medium">{value}</p>
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
