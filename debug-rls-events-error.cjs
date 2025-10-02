const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRLSEventsError() {
  console.log('🔍 Debugging RLS Events Error...\n');

  try {
    // 1. Check current user/session
    console.log('1. Checking current user session...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('❌ User error:', userError);
    } else {
      console.log('✅ Current user:', user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        user_metadata: user.user_metadata
      } : 'No user logged in');
    }

    // 2. Check RLS policies for events table
    console.log('\n2. Checking RLS policies for events table...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'events' })
      .select('*');
    
    if (policiesError) {
      console.log('❌ Error getting policies:', policiesError);
      
      // Try alternative method
      console.log('Trying alternative method to check policies...');
      const { data: altPolicies, error: altError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'events');
      
      if (altError) {
        console.log('❌ Alternative method also failed:', altError);
      } else {
        console.log('✅ Policies found via alternative method:', altPolicies);
      }
    } else {
      console.log('✅ RLS Policies:', policies);
    }

    // 3. Check if RLS is enabled on events table
    console.log('\n3. Checking if RLS is enabled on events table...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'events' });
    
    if (rlsError) {
      console.log('❌ Error checking RLS status:', rlsError);
    } else {
      console.log('✅ RLS Status:', rlsStatus);
    }

    // 4. Try to check table permissions
    console.log('\n4. Checking table permissions...');
    const { data: permissions, error: permError } = await supabase
      .rpc('check_table_permissions', { table_name: 'events' });
    
    if (permError) {
      console.log('❌ Error checking permissions:', permError);
    } else {
      console.log('✅ Table permissions:', permissions);
    }

    // 5. Test simple select on events table
    console.log('\n5. Testing simple select on events table...');
    const { data: selectTest, error: selectError } = await supabase
      .from('events')
      .select('id, patient_id, type, created_at')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Select test failed:', selectError);
    } else {
      console.log('✅ Select test successful. Sample data:', selectTest);
    }

    // 6. Check if we can access the specific patient
    console.log('\n6. Checking access to specific patient...');
    const patientId = '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3';
    const { data: patientAccess, error: patientError } = await supabase
      .from('patients')
      .select('id, name, status')
      .eq('id', patientId);
    
    if (patientError) {
      console.log('❌ Patient access failed:', patientError);
    } else {
      console.log('✅ Patient access successful:', patientAccess);
    }

    // 7. Try a minimal insert to test RLS
    console.log('\n7. Testing minimal insert to events table...');
    const testEvent = {
      patient_id: patientId,
      type: 'test',
      occurred_at: new Date().toISOString(),
      notes: 'RLS test event'
    };

    const { data: insertTest, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select();
    
    if (insertError) {
      console.log('❌ Insert test failed:', insertError);
      console.log('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Insert test successful:', insertTest);
      
      // Clean up test event
      if (insertTest && insertTest[0]) {
        await supabase
          .from('events')
          .delete()
          .eq('id', insertTest[0].id);
        console.log('🧹 Test event cleaned up');
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

debugRLSEventsError();