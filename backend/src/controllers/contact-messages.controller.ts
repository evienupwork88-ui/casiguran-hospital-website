import type { Request, Response } from "express";
import { sendContactInquiryEmail } from "../services/contact-inquiry-email.service";
import type { CreateContactMessageInput } from "../validation/contact-messages.schema";

export async function submitPublicContactMessage(req: Request, res: Response) {
  const input = req.body as CreateContactMessageInput;
  await sendContactInquiryEmail(input);
  res.status(201).json({
    message: "Thank you for contacting Casiguran District Hospital. Your inquiry has been successfully submitted to the hospital administration for review. Please note that response times may vary, and responses are not guaranteed.",
  });
}
