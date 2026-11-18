"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUpRight, Check } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Please enter a valid email address."),
  topic: z.string().min(1, "Please choose a topic."),
  message: z.string().trim().min(10, "Please share a little more (at least 10 characters).").max(2000, "Please keep your message under 2,000 characters."),
});

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [notice, setNotice] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", topic: "", message: "" },
  });

  function submitMessage(values: ContactValues) {
    const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
    if (!contactEmail) {
      setNotice("Your details are valid, but message delivery is not configured in this preview. Please check back soon.");
      return;
    }

    const subject = encodeURIComponent(`TRYVORA enquiry: ${values.topic}`);
    const body = encodeURIComponent(`From: ${values.name} (${values.email})\n\n${values.message}`);
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    emailLink.click();
    setNotice("Your email app is opening with your message addressed to TRYVORA.");
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit(submitMessage)} noValidate>
      <div className="form-row">
        <label>
          Your name
          <input autoComplete="name" placeholder="How should we address you?" {...register("name")} />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </label>
        <label>
          Email address
          <input autoComplete="email" placeholder="you@example.com" type="email" {...register("email")} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>
      </div>
      <label>
        What can we help with?
        <select {...register("topic")}>
          <option value="">Choose a topic</option>
          <option value="product">Product & try-on</option>
          <option value="partnership">Partnerships</option>
          <option value="privacy">Privacy & data</option>
          <option value="other">Something else</option>
        </select>
        {errors.topic && <span className="field-error">{errors.topic.message}</span>}
      </label>
      <label>
        Your message
        <textarea placeholder="Tell us what’s on your mind..." rows={5} {...register("message")} />
        {errors.message && <span className="field-error">{errors.message.message}</span>}
      </label>
      <div className="form-submit-row">
        <Button className="button button-dark" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Checking..." : "Send a note"} <ArrowUpRight size={16} />
        </Button>
        <span className="privacy-hint"><Check size={14} /> We only use your details to respond.</span>
      </div>
      {notice && <p className="form-notice" role="status">{notice}</p>}
    </form>
  );
}
