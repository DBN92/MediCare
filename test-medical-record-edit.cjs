const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqjqfkgvqjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmtndnFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzAsImV4cCI6MjA1MDU0Nzk3MH0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMedicalRecordEdit() {
  console.log('🔍 Testando funcionalidade de edição de prontuários...\n');

  try {
    // 1. Verificar se existem prontuários na tabela
    console.log('1. Verificando prontuários existentes...');
    const { data: records, error: selectError } = await supabase
      .from('medical_records')
      .select('id, patient_id, doctor_id, status, record_date, created_at')
      .limit(5);

    if (selectError) {
      console.error('❌ Erro ao buscar prontuários:', selectError);
      return;
    }

    console.log(`✅ Encontrados ${records?.length || 0} prontuários`);
    if (records && records.length > 0) {
      console.log('Primeiros registros:');
      records.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record.id}, Status: ${record.status}, Doctor ID: ${record.doctor_id}`);
      });
    }

    // 2. Se não há registros, criar um para teste
    let testRecordId = null;
    if (!records || records.length === 0) {
      console.log('\n2. Criando prontuário de teste...');
      
      // Primeiro, verificar se há pacientes
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .limit(1);

      if (!patients || patients.length === 0) {
        console.log('❌ Não há pacientes cadastrados. Criando um paciente de teste...');
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            full_name: 'Paciente Teste',
            date_of_birth: '1990-01-01',
            gender: 'M',
            phone: '11999999999',
            email: 'teste@teste.com'
          })
          .select()
          .single();

        if (patientError) {
          console.error('❌ Erro ao criar paciente:', patientError);
          return;
        }
        console.log('✅ Paciente criado:', newPatient.id);
      }

      // Verificar se há médicos (profiles)
      const { data: doctors } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!doctors || doctors.length === 0) {
        console.log('❌ Não há médicos cadastrados. Não é possível criar prontuário.');
        return;
      }

      const patientId = patients?.[0]?.id || (await supabase.from('patients').select('id').limit(1).single()).data?.id;
      const doctorId = doctors[0].id;

      const { data: newRecord, error: insertError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,
          record_date: new Date().toISOString().split('T')[0],
          chief_complaint: 'Teste inicial',
          status: 'draft'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar prontuário:', insertError);
        return;
      }

      testRecordId = newRecord.id;
      console.log('✅ Prontuário de teste criado:', testRecordId);
    } else {
      testRecordId = records[0].id;
      console.log(`\n2. Usando prontuário existente para teste: ${testRecordId}`);
    }

    // 3. Testar atualização do prontuário
    console.log('\n3. Testando atualização do prontuário...');
    const updateData = {
      chief_complaint: 'Queixa principal atualizada - ' + new Date().toISOString(),
      status: 'in_progress',
      notes: 'Teste de atualização realizado em ' + new Date().toLocaleString('pt-BR')
    };

    const { data: updatedRecord, error: updateError } = await supabase
      .from('medical_records')
      .update(updateData)
      .eq('id', testRecordId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar prontuário:', updateError);
      console.error('Detalhes do erro:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Prontuário atualizado com sucesso!');
    console.log('Dados atualizados:', {
      id: updatedRecord.id,
      status: updatedRecord.status,
      chief_complaint: updatedRecord.chief_complaint,
      updated_at: updatedRecord.updated_at
    });

    // 4. Testar mudança de status específica
    console.log('\n4. Testando mudança de status...');
    const statusOptions = ['draft', 'in_progress', 'completed', 'cancelled'];
    const currentStatus = updatedRecord.status;
    const newStatus = statusOptions.find(s => s !== currentStatus) || 'completed';

    const { data: statusUpdated, error: statusError } = await supabase
      .from('medical_records')
      .update({ status: newStatus })
      .eq('id', testRecordId)
      .select('id, status, updated_at')
      .single();

    if (statusError) {
      console.error('❌ Erro ao atualizar status:', statusError);
      return;
    }

    console.log('✅ Status atualizado com sucesso!');
    console.log(`Status alterado de "${currentStatus}" para "${statusUpdated.status}"`);

    console.log('\n🎉 Todos os testes de edição passaram com sucesso!');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

testMedicalRecordEdit();
