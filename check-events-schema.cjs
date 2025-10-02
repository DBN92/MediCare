const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkEventsSchema() {
  console.log('🔍 Verificando esquema atual da tabela events...\n')

  try {
    // Tentar inserir um evento simples para ver quais campos existem
    const testEvent = {
      patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3',
      type: 'meal',
      occurred_at: new Date().toISOString(),
      notes: 'Teste de esquema'
    }

    const { data, error } = await supabase
      .from('events')
      .insert([testEvent])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao inserir evento de teste:', error.message)
      return
    }

    console.log('✅ Evento de teste criado:', data.id)

    // Buscar o evento para ver todos os campos disponíveis
    const { data: eventData, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', data.id)
      .single()

    if (fetchError) {
      console.error('❌ Erro ao buscar evento:', fetchError.message)
      return
    }

    console.log('\n📋 Campos disponíveis na tabela events:')
    Object.keys(eventData).forEach(field => {
      console.log(`   - ${field}: ${typeof eventData[field]} (${eventData[field] === null ? 'null' : eventData[field]})`)
    })

    // Testar campos específicos que precisamos
    const fieldsToTest = [
      'medication_name',
      'dosage', 
      'route',
      'drain_type',
      'left_amount',
      'right_amount',
      'left_aspect',
      'right_aspect',
      'systolic_bp',
      'diastolic_bp',
      'heart_rate',
      'temperature',
      'oxygen_saturation',
      'respiratory_rate',
      'liquid_type',
      'meal_type',
      'consumption_percentage'
    ]

    console.log('\n🔍 Verificando campos necessários para todos os tipos de eventos:')
    fieldsToTest.forEach(field => {
      const exists = eventData.hasOwnProperty(field)
      console.log(`   ${exists ? '✅' : '❌'} ${field}`)
    })

    // Remover evento de teste
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', data.id)

    if (deleteError) {
      console.error('❌ Erro ao remover evento de teste:', deleteError.message)
    } else {
      console.log('\n🧹 Evento de teste removido')
    }

    // Verificar tipos de eventos disponíveis
    console.log('\n🏷️ Testando tipos de eventos disponíveis:')
    const eventTypes = ['meal', 'drink', 'bathroom', 'mood', 'medication', 'drain', 'vital_signs', 'note']
    
    for (const type of eventTypes) {
      const testTypeEvent = {
        patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3',
        type: type,
        occurred_at: new Date().toISOString(),
        notes: `Teste tipo ${type}`
      }

      const { data: typeData, error: typeError } = await supabase
        .from('events')
        .insert([testTypeEvent])
        .select()
        .single()

      if (typeError) {
        console.log(`   ❌ ${type}: ${typeError.message}`)
      } else {
        console.log(`   ✅ ${type}: OK`)
        // Remover imediatamente
        await supabase.from('events').delete().eq('id', typeData.id)
      }
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  }
}

checkEventsSchema()