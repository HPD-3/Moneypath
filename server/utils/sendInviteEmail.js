import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({ to, groupName, featureName, inviteCode, inviterName }) {
    if (!to) return null;

    return resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to,
        subject: `Undangan ${featureName} - ${groupName}`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
                <h2 style="color: #1a3a1f; margin-bottom: 12px;">Undangan ${featureName}</h2>
                <p>Kamu diundang untuk bergabung ke <strong>${groupName}</strong>.</p>
                <p>Diundang oleh: <strong>${inviterName || "MoneyPath"}</strong></p>
                <p>Kode undangan: <strong style="letter-spacing: 2px;">${inviteCode}</strong></p>
                <p>Buka aplikasi MoneyPath dan masukkan kode undangan tersebut untuk menerima undangan.</p>
            </div>
        `,
    });
}   