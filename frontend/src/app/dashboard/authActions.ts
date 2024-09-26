// This is the server action for signing out the user
'use server';

import { signOut as authSignOut } from '@lib/auth';

export async function signOut() {
  await authSignOut();
}
