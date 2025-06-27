'use server';

export async function verifyUser(username: string): Promise<{ success: boolean; error?: string }> {
  if (!username) {
    return { success: false, error: 'Username is required.' };
  }

  try {
    const response = await fetch('https://pastebin.com/raw/PJ1dfNnx', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch user list. Status: ${response.status}`);
    }

    const text = await response.text();
    const whitelist = text.split('\n').map(u => u.trim().toLowerCase()).filter(Boolean);

    if (whitelist.includes(username.toLowerCase())) {
      return { success: true };
    } else {
      return { success: false, error: 'This username is not authorized to access the application.' };
    }
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: 'Could not verify username. Please check your network connection and try again.' };
  }
}
