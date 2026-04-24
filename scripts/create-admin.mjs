import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://skvwqsujccnfaheepekh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdndxc3VqY2NuZmFoZWVwZWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2NTEzOSwiZXhwIjoyMDg5ODQxMTM5fQ.VlONVQYOpU550Qt_4fDDwqMAz9s7ckWecsxcZ7wr288';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAdmin() {
  console.log('🚀 Provisioning Admin: admin@foodstop.com...');

  // 1. Create the user in Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@foodstop.com',
    password: 'admin123456',
    email_confirm: true,
    user_metadata: { full_name: 'Admin User' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ User already exists in Auth, updating role only...');
    } else {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }
  }

  const userId = authUser?.user?.id;
  
  // If user already existed, we need to find their ID
  let targetId = userId;
  if (!targetId) {
    const { data: users } = await supabase.auth.admin.listUsers();
    targetId = users.users.find(u => u.email === 'admin@foodstop.com')?.id;
  }

  if (!targetId) {
    console.error('❌ Could not determine User ID');
    return;
  }

  // 2. Update profile to Admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', targetId);

  if (profileError) {
    // If profile doesn't exist, try to insert
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert({ id: targetId, full_name: 'Admin User', role: 'admin', email: 'admin@foodstop.com' });
      
    if (insertError) {
      console.error('❌ Error updating profile:', insertError.message);
      return;
    }
  }

  console.log('✅ Admin Provisioned Successfully!');
  console.log('Email: admin@foodstop.com');
  console.log('Password: admin123456');
}

createAdmin();
