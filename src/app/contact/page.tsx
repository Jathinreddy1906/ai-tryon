import type { Metadata } from "next";
import { ArrowDownRight, Clock3, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Get in touch",
  description: "Contact the TRYVORA team with a product, privacy, or partnership enquiry.",
};

export default function ContactPage() {
  return (
    <div className="page-wrap contact-wrap">
      <section className="contact-intro">
        <span className="eyebrow"><span className="eyebrow-line" /> WE’RE ALL EARS</span>
        <h1>Let’s start<br /><em>a conversation.</em></h1>
        <p>Curious about TRYVORA, exploring a collaboration, or just want to say hello? Leave us a note.</p>
        <ArrowDownRight className="contact-arrow" size={21} />
        <div className="contact-meta">
          <div><MessageCircle size={17} /><span><strong>Good questions welcome</strong><br />We’ll make space for the details.</span></div>
          <div><Clock3 size={17} /><span><strong>Thoughtful replies take time</strong><br />We’ll be in touch when we can.</span></div>
        </div>
      </section>
      <section className="contact-form-panel">
        <div className="form-panel-heading">
          <span className="eyebrow">WRITE US A NOTE</span>
          <p>All fields are required. Your details stay in this browser unless you choose to open your configured email app.</p>
        </div>
        <ContactForm />
      </section>
    </div>
  );
}
