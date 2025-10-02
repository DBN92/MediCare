const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function applyEventsSchemaUpdate() {
  console.log('🔧 Aplicando atualização do esquema da tabela events...\n')

  const sqlCommands = [
    // 1. Adicionar novos tipos de eventos
    "ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'medication'",
    "ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'drain'",
    "ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'vital_signs'",
    
    // 2. Adicionar campos para medicamentos
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS medication_name VARCHAR(255)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS dosage VARCHAR(100)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS route VARCHAR(100)",
    
    // 3. Adicionar campos para drenos
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS drain_type VARCHAR(100)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS left_amount INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS right_amount INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS left_aspect VARCHAR(255)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS right_aspect VARCHAR(255)",
    
    // 4. Adicionar campos para sinais vitais
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS systolic_bp INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS diastolic_bp INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS heart_rate INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS temperature DECIMAL(4,1)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS oxygen_saturation INTEGER",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS respiratory_rate INTEGER",
    
    // 5. Adicionar campos adicionais
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS liquid_type VARCHAR(100)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_type VARCHAR(100)",
    "ALTER TABLE events ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER"
  ]

  try {
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`📝 Executando comando ${i + 1}/${sqlCommands.length}:`)
      console.log(`   ${sql}`)
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message)
        // Continuar com os próximos comandos mesmo se um falhar
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`)
      }
      console.log('')
    }

    console.log('🎉 Atualização do esquema concluída!')
    console.log('\n📊 Testando inserção de eventos com novos campos...')

    // Testar inserção de um evento de cada tipo
    const testEvents = [
      {
        patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3', // ID do paciente Edilene
        type: 'medication',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Medicamento',
        medication_name: 'Paracetamol',
        dosage: '500mg',
        route: 'Oral'
      },
      {
        patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3',
        type: 'drain',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Dreno',
        drain_type: 'Torácico',
        left_amount: 50,
        right_amount: 30,
        left_aspect: 'Seroso',
        right_aspect: 'Sanguinolento'
      },
      {
        patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3',
        type: 'vital_signs',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Sinais Vitais',
        systolic_bp: 120,
        diastolic_bp: 80,
        heart_rate: 75,
        temperature: 36.5,
        oxygen_saturation: 98,
        respiratory_rate: 18
      }
    ]

    const createdEventIds = []

    for (const event of testEvents) {
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single()

      if (eventError) {
        console.error(`❌ Erro ao criar evento ${event.type}:`, eventError.message)
      } else {
        createdEventIds.push(createdEvent.id)
        console.log(`✅ Evento ${event.type} criado com sucesso (ID: ${createdEvent.id})`)
      }
    }

    // Limpar eventos de teste
    if (createdEventIds.length > 0) {
      console.log('\n🧹 Removendo eventos de teste...')
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', createdEventIds)

      if (deleteError) {
        console.error('❌ Erro ao remover eventos de teste:', deleteError.message)
      } else {
        console.log(`✅ ${createdEventIds.length} eventos de teste removidos`)
      }
    }

    console.log('\n🎉 Esquema atualizado e testado com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error.message)
  }
}

applyEventsSchemaUpdate()