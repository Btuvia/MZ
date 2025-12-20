"use server";

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

export async function sendEmail(to: string, subject: string, html: string) {
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
            subject: subject,
            html: html,
        });

        console.log("Email sent successfully:", data);
        return { success: true, data };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: (error as Error).message };
    }
}
