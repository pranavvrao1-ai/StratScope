import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Have a suggestion, correction, or topic you'd like to see covered? Get in touch with StratScope.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-ink">
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-3xl px-6">
          <span className="font-mono text-xs tracking-[0.3em] text-gold">Get in touch</span>
          <h1 className="mt-2 font-serif text-4xl font-bold text-white md:text-6xl">Contact</h1>
          <div className="mb-8 mt-6 h-px w-full bg-gradient-to-r from-gold to-transparent" />
          <p className="mb-10 font-sans text-sm leading-relaxed text-gray-400 md:text-base">
            Have a suggestion, correction, or topic you&apos;d like to see covered? I&apos;d love to hear from you. Reach out directly at{" "}
            <a href={`mailto:${SITE.contactEmail}`} className="text-gold underline transition-colors hover:text-white">
              {SITE.contactEmail}
            </a>{" "}
            or use the form below.
          </p>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
