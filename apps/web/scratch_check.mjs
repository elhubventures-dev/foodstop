import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://skvwqsujccnfaheepekh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdndxc3VqY2NuZmFoZWVwZWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2NTEzOSwiZXhwIjoyMDg5ODQxMTM5fQ.VlONVQYOpU550Qt_4fDDwqMAz9s7ckWecsxcZ7wr288';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Checking categories...');
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*');
    
  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log(`Found ${categories?.length || 0} categories:`);
    categories?.forEach(c => console.log(`- ${c.name} (${c.slug})`));
  }

  console.log('\nChecking menu items...');
  const { data: items, error: itemError } = await supabase
    .from('menu_items')
    .select('name, slug, category_id');
    
  if (itemError) {
    console.error('Error fetching items:', itemError);
  } else {
    console.log(`Found ${items?.length || 0} items:`);
    items?.forEach(i => console.log(`- ${i.name} (${i.slug})`));
  }
}

checkDatabase();
