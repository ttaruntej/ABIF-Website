import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Testing SMTP credentials from .env...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('Port:', process.env.SMTP_PORT);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Sending test email to tbimanager@abif.iitkgp.ac.in...');
        const info = await transporter.sendMail({
            from: `"Local ABIF Test" <${process.env.SMTP_FROM}>`,
            to: "tbimanager@abif.iitkgp.ac.in",
            subject: "Tactical Test: Local SMTP Verification",
            text: "Verification successful if received. Confirming credentials are live.",
            html: "<b>Verification successful if received. Confirming credentials are live.</b>"
        });
        console.log('SUCCESS:', info.messageId);
    } catch (error) {
        console.error('FAILED:', error);
    }
}

main();
