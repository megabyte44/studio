import webpush from 'web-push';

const {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    VAPID_SUBJECT
} = process.env;

if (
    NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    VAPID_PRIVATE_KEY &&
    VAPID_SUBJECT
) {
    try {
        webpush.setVapidDetails(
            VAPID_SUBJECT,
            NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    } catch (error) {
        console.error("Failed to initialize web-push with VAPID details. This is likely due to misconfigured environment variables.", error instanceof Error ? error.message : String(error));
    }
} else {
    console.warn("VAPID keys are not fully configured. Push notifications will not work if not configured at runtime.");
}

export default webpush;
