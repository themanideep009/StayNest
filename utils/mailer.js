const nodemailer = require("nodemailer");

function isEmailConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.EMAIL_FROM
    );
}

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

async function sendPasswordResetEmail({ to, code }) {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: "WanderLust password reset code",
        text: `Your WanderLust password reset verification code is ${code}. This code will expire in 15 minutes.`,
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2f2419;max-width:560px;margin:0 auto;">
                <h2 style="margin-bottom:12px;">Password reset verification</h2>
                <p>We received a request to reset your WanderLust account password.</p>
                <p>Enter the verification code below on the password reset page to continue:</p>
                <div style="margin:24px 0;padding:18px 20px;background:#fff7f0;border:1px solid #f0d4c3;border-radius:16px;text-align:center;">
                    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#7d6652;margin-bottom:8px;">Verification code</div>
                    <div style="font-size:32px;font-weight:700;letter-spacing:0.24em;color:#9e5028;">${code}</div>
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you did not request a password reset, you can safely ignore this email.</p>
                <p style="margin-top:24px;color:#7d6652;">WanderLust Security Team</p>
            </div>
        `,
    });
}

module.exports = {
    isEmailConfigured,
    sendPasswordResetEmail,
};
