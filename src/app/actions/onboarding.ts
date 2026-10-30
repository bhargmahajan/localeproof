'server-only' // or 'use server' depending on your setup
'use server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function submitPhone(formData: FormData) {
  let phone = formData.get('phone') as string
  const token = formData.get('token') as string 

  if (!token) return { error: "Unauthorized. Missing session token." }

  // 1. Sanitize the phone number to strict E.164 format (+91...)
  phone = phone.replace(/[\s\-\(\)]/g, '')
  if (!phone.startsWith('+')) {
    phone = '+' + phone 
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )

  // 2. Verify the session token securely
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return { error: "Invalid session." }

  // 3. Explicitly check if another user account already owns this phone number
  // (List users pagination approach or list filter if supported, or check via admin listing)
  const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  
  if (!listError && existingUsers?.users) {
    const phoneExists = existingUsers.users.some(
      (u) => u.phone === phone && u.id !== user.id
    )
    if (phoneExists) {
      return { error: "An account with this phone number already exists." }
    }
  }

  // 4. Force-update the phone number in the auth.users table for the current user
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    phone: phone,
    phone_confirm: true 
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('duplicate key')) {
      return { error: "An account with this phone number already exists." }
    }
    return { error: `Update failed: ${error.message}` }
  }
  
  return { success: true }
}