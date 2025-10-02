const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventTypeEnum() {
  console.log('🔍 Checking Event Type Enum Values...\n');

  try {
    // 1. Check existing events to see what types are used
    console.log('1. Checking existing event types in the database...');
    const { data: existingEvents, error: existingError } = await supabase
      .from('events')
      .select('type')
      .limit(20);
    
    if (existingError) {
      console.log('❌ Error getting existing events:', existingError);
    } else {
      const uniqueTypes = [...new Set(existingEvents.map(e => e.type))];
      console.log('✅ Existing event types found:', uniqueTypes);
    }

    // 2. Try different common event types to see which ones work
    console.log('\n2. Testing different event types...');
    const patientId = '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3';
    const testTypes = [
      'bathroom',
      'medication',
      'meal',
      'vital_signs',
      'hygiene',
      'mobility',
      'sleep',
      'mood',
      'observation',
      'drain',
      'liquid'
    ];

    for (const testType of testTypes) {
      console.log(`\nTesting type: "${testType}"`);
      
      const testEvent = {
        patient_id: patientId,
        type: testType,
        occurred_at: new Date().toISOString(),
        notes: `Test event for type ${testType}`,
        bathroom_type: testType === 'bathroom' ? 'stool' : null,
        updated_at: new Date().toISOString()
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('events')
        .insert([testEvent])
        .select();
      
      if (insertError) {
        console.log(`❌ Type "${testType}" failed:`, {
          code: insertError.code,
          message: insertError.message
        });
      } else {
        console.log(`✅ Type "${testType}" succeeded!`);
        
        // Clean up test event
        if (insertTest && insertTest[0]) {
          await supabase
            .from('events')
            .delete()
            .eq('id', insertTest[0].id);
          console.log(`🧹 Test event for "${testType}" cleaned up`);
        }
      }
    }

    // 3. Test the exact data from the error log
    console.log('\n3. Testing the exact data from the error log...');
    const exactTestData = {
      patient_id: "9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3",
      occurred_at: "2025-10-01T20:52:00.000Z",
      type: "bathroom",
      notes: "",
      volume_ml: null,
      bathroom_type: "stool",
      updated_at: "2025-10-01T20:52:29.171Z"
    };

    console.log('Exact test data:', JSON.stringify(exactTestData, null, 2));

    const { data: exactInsert, error: exactError } = await supabase
      .from('events')
      .insert([exactTestData])
      .select();
    
    if (exactError) {
      console.log('❌ Exact data test failed:', {
        code: exactError.code,
        message: exactError.message,
        details: exactError.details,
        hint: exactError.hint
      });
    } else {
      console.log('✅ Exact data test succeeded!', exactInsert);
      
      // Clean up
      if (exactInsert && exactInsert[0]) {
        await supabase
          .from('events')
          .delete()
          .eq('id', exactInsert[0].id);
        console.log('🧹 Exact test event cleaned up');
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkEventTypeEnum();