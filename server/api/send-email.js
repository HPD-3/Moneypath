import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailHandler = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        const data = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: ["your@email.com"],
            subject: "New Message",
            html: `
                <h3>New Message</h3>
                <p>${name}</p>
                <p>${email}</p>
                <p>${message}</p>
            `,
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};