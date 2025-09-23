import nodemailer from 'nodemailer';


// Configure Nodemailer with Brevo SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

export const sendBulkEmails = async (req, res) => {
    const { subject, text, html, recipients } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients list is required.' });
    }

    try {
        // Send emails
        const sendResults = await Promise.all(
            recipients.map(async (email) => {
                try {
                    await transporter.sendMail({
                        from: process.env.BREVO_SMTP_USER,
                        to: email,
                        subject,
                        text,
                        html,
                    });
                    return { email, status: 'sent' };
                } catch (err) {
                    return { email, status: 'failed', error: err.message };
                }
            })
        );

        // Store in DB
        await BulkEmail.create({
            subject,
            text,
            html,
            recipients: JSON.stringify(recipients),
            results: JSON.stringify(sendResults),
        });

        res.json({ message: 'Bulk emails processed.', results: sendResults });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};