
import { mailtrapClient, sender } from "../lib/mailtrap.js";
import {
	createCommentNotificationEmailTemplate,
	createConnectionAcceptedEmailTemplate,
	createLoginAlertEmailTemplate,
	createWelcomeEmailTemplate,
} from "./emailTemplates.js";

const canSendEmail = () => {
	return !!mailtrapClient && !!sender?.email && !!sender?.name;
};

const sendEmailSafely = async ({ toEmail, subject, html, category }) => {
	if (!canSendEmail()) {
		console.warn(
			"[mail] Skipping email (Mailtrap not configured). Set MAILTRAP_TOKEN, EMAIL_FROM, EMAIL_FROM_NAME."
		);
		return { skipped: true };
	}
	if (!toEmail) {
		console.warn("[mail] Skipping email (missing recipient email).", { subject, category });
		return { skipped: true };
	}

	const recipient = [{ email: toEmail }];
	return mailtrapClient.send({
		from: sender,
		to: recipient,
		subject,
		html,
		category,
	});
};

export const sendWelcomeEmail = async (email, name, profileUrl)=>{
    try {
		const response = await sendEmailSafely({
			toEmail: email,
			subject: "Welcome to UnLinked",
			html: createWelcomeEmailTemplate(name, profileUrl),
			category: "welcome",
		});

		if (!response?.skipped) console.log("Welcome Email sent successfully");
        
    } catch (error) {
        throw error;
        
    }
}

export const sendCommentNotificationEmail = async (recipientEmail, recipientName, commenterName, postUrl, commentContent) => {
	try {
		const response = await sendEmailSafely({
			toEmail: recipientEmail,
			subject: "New Comment on Your Post",
			html: createCommentNotificationEmailTemplate(recipientName, commenterName, postUrl, commentContent),
			category: "comment_notification",
		});

		if (!response?.skipped) console.log("Comment Notification Email sent successfully");
	} catch (error) {
		throw error
		
	}
}
export const sendConnectionAcceptedEmail = async (recipientEmail, recipientName, senderName, profileUrl) => {
	try {
		await sendEmailSafely({
			toEmail: recipientEmail,
			subject: `${recipientName} accepted your connection request`,
			html: createConnectionAcceptedEmailTemplate(senderName, recipientName, profileUrl),
			category: "connection_accepted",
		});
	} catch (error) {
		throw error;
	}
}

export const sendLoginAlertEmail = async (email, name) => {
	try {
		const response = await sendEmailSafely({
			toEmail: email,
			subject: "New login to your UnLinked account",
			html: createLoginAlertEmailTemplate(name),
			category: "login_alert",
		});
		if (!response?.skipped) console.log("Login Alert Email sent successfully");
	} catch (error) {
		throw error;
	}
};