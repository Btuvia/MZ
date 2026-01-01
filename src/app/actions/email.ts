"use server";

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

type EmailParams = {
    to: string;
    subject: string;
    body?: string;
    html?: string;
};

export async function sendEmail(params: EmailParams | string, subject?: string, html?: string) {
    // Support both old format (3 params) and new format (object)
    let to: string;
    let emailSubject: string;
    let emailHtml: string;

    if (typeof params === 'object') {
        to = params.to;
        emailSubject = params.subject;
        emailHtml = params.html || params.body || '';
    } else {
        to = params;
        emailSubject = subject || '';
        emailHtml = html || '';
    }

    console.log("Attempting to send email to:", to);

    if (!resend) {
        console.warn("⚠️ No RESEND_API_KEY found. Mocking email send.");
        // Simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true, message: "Email simulation successful (Check logs)", isMock: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'InsurCRM <onboarding@resend.dev>', // Default Resend testing domain
            to: [to],
            subject: emailSubject,
            html: emailHtml,
        });

        console.log("Email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: (error as Error).message };
    }
}
