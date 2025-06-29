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

    const whitelist = await response.json();

    if (!Array.isArray(whitelist)) {
      throw new Error('User list from source is not a valid array.');
    }

    const lowerCaseWhitelist: string[] = whitelist.map(u => String(u).trim().toLowerCase());

    if (lowerCaseWhitelist.includes(username.toLowerCase())) {
      return { success: true };
    } else {
      return { success: false, error: 'This username is not authorized to access the application.' };
    }
  } catch (error) {
    console.error("Verification error:", error);
    return { success: false, error: 'Could not verify username. Please check your network connection and try again.' };
  }
}
