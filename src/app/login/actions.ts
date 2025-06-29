'use server';

// The list of authorized users. For this example, we're using a simple array.
// In a real application, this would be a database check.
const authorizedUsers = ["admin", "guest", "johndoe"];

export async function verifyUser(username: string): Promise<{ success: boolean; error?: string }> {
  if (!username) {
    return { success: false, error: 'Username is required.' };
  }
  
  // We'll perform a case-insensitive check.
  const lowerCaseUsername = username.trim().toLowerCase();
  const lowerCaseWhitelist = authorizedUsers.map(u => u.toLowerCase());

  if (lowerCaseWhitelist.includes(lowerCaseUsername)) {
    return { success: true };
  } else {
    return { success: false, error: 'This username is not authorized to access the application.' };
  }
}
