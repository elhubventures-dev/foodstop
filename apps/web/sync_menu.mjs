import { createClient } from '@supabase/supabase-js';
import { MOCK_CATEGORIES, MOCK_ITEMS } from './lib/mockData.js';

const supabaseUrl = 'https://skvwqsujccnfaheepekh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdndxc3VqY2NuZmFoZWVwZWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2NTEzOSwiZXhwIjoyMDg5ODQxMTM5fQ.VlONVQYOpU550Qt_4fDDwqMAz9s7ckWecsxcZ7wr288';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncMenu() {
  console.log('Syncing categories...');
  const categoryMap = {};
  
  for (const cat of MOCK_CATEGORIES) {
    // Check if category exists by slug
    const { data: existingCat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', cat.slug)
      .single();
      
    if (existingCat) {
      console.log(`Category ${cat.name} already exists.`);
      categoryMap[cat.slug] = existingCat.id;
    } else {
      console.log(`Inserting category ${cat.name}...`);
      const { data: newCat, error } = await supabase
        .from('categories')
        .insert([{ 
          name: cat.name, 
          slug: cat.slug,
          display_order: parseInt(cat.id) || 0
        }])
        .select()
        .single();
        
      if (error) {
        console.error(`Error inserting category ${cat.name}:`, error);
      } else {
        categoryMap[cat.slug] = newCat.id;
      }
    }
  }
  
  console.log('\nSyncing menu items...');
  for (const item of MOCK_ITEMS) {
    const categoryId = categoryMap[item.category_slug];
    if (!categoryId) {
      console.warn(`Skipping item ${item.name}: Category ${item.category_slug} not found.`);
      continue;
    }
    
    // Check if item exists by slug
    const { data: existingItem } = await supabase
      .from('menu_items')
      .select('id')
      .eq('slug', item.slug)
      .single();
      
    if (existingItem) {
      console.log(`Item ${item.name} already exists.`);
      // Optional: Update it?
    } else {
      console.log(`Inserting item ${item.name}...`);
      const { error } = await supabase
        .from('menu_items')
        .insert([{
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          category_id: categoryId,
          preparation_time: item.preparation_time || 0,
          spice_level: item.spice_level || 0,
          image_url: item.image_url,
          dietary_tags: item.dietary_tags || [],
          is_available: true,
          is_featured: item.is_featured || false,
          display_order: parseInt(item.id) || 0
        }]);
        
      if (error) {
        console.error(`Error inserting item ${item.name}:`, error);
      }
    }
  }
  
  console.log('\nSync complete!');
}

syncMenu();
