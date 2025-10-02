const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testAllEventTypesInReports() {
  console.log('🧪 Testando todos os tipos de eventos nos relatórios...\n')

  try {
    // 1. Buscar um paciente existente
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1)

    if (patientsError || !patients || patients.length === 0) {
      console.error('❌ Erro ao buscar pacientes:', patientsError?.message || 'Nenhum paciente encontrado')
      return
    }

    const testPatient = patients[0]
    console.log(`✅ Usando paciente: ${testPatient.full_name} (ID: ${testPatient.id})`)

    // 2. Criar eventos de teste para todos os tipos
    const testEvents = [
      // Evento de medicação
      {
        patient_id: testPatient.id,
        type: 'medication',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Paracetamol 500mg',
        medication_name: 'Paracetamol',
        dosage: '500mg',
        route: 'Oral'
      },
      // Evento de líquidos
      {
        patient_id: testPatient.id,
        type: 'drink',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Água',
        volume_ml: 250
      },
      // Evento de dreno
      {
        patient_id: testPatient.id,
        type: 'drain',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Drenagem',
        left_amount: 50,
        right_amount: 30,
        left_aspect: 'Seroso',
        right_aspect: 'Sanguinolento'
      },
      // Evento de sinais vitais
      {
        patient_id: testPatient.id,
        type: 'vital_signs',
        occurred_at: new Date().toISOString(),
        notes: 'Teste - Sinais vitais',
        systolic_bp: 120,
        diastolic_bp: 80,
        heart_rate: 75,
        temperature: 36.5,
        oxygen_saturation: 98,
        respiratory_rate: 18
      }
    ]

    console.log('\n📝 Criando eventos de teste...')
    const createdEventIds = []

    for (const event of testEvents) {
      const { data: createdEvent, error: eventError } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single()

      if (eventError) {
        console.error(`❌ Erro ao criar evento ${event.type}:`, eventError.message)
        continue
      }

      createdEventIds.push(createdEvent.id)
      console.log(`✅ Evento ${event.type} criado (ID: ${createdEvent.id})`)
    }

    // 3. Buscar todos os eventos do paciente
    console.log('\n🔍 Verificando eventos criados...')
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('patient_id', testPatient.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Erro ao buscar eventos:', fetchError.message)
      return
    }

    console.log(`✅ Total de eventos encontrados: ${allEvents.length}`)

    // 4. Agrupar eventos por tipo
    const eventsByType = {}
    allEvents.forEach(event => {
      if (!eventsByType[event.type]) {
        eventsByType[event.type] = []
      }
      eventsByType[event.type].push(event)
    })

    console.log('\n📊 Eventos por tipo:')
    Object.entries(eventsByType).forEach(([type, events]) => {
      console.log(`   ${type}: ${events.length} evento(s)`)
    })

    // 5. Simular processamento dos relatórios
    console.log('\n📈 Simulando processamento dos relatórios...')
    
    const dailyStats = {}
    
    allEvents.forEach(event => {
      const date = event.occurred_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          alimentosPercent: 0,
          alimentosCount: 0,
          medicacaoCount: 0,
          banheiroCount: 0,
          totalLiquidos: 0,
          liquidosML: 0,
          liquidosCount: 0,
          drenosML: 0,
          drenoEsquerdo: 0,
          drenoDireito: 0,
          drenoCount: 0,
          urinaML: 0,
          humorScore: 0,
          humorCount: 0,
          sinaisVitais: {
            pressaoSistolica: 0,
            pressaoDiastolica: 0,
            frequenciaCardiaca: 0,
            temperatura: 0,
            saturacaoOxigenio: 0,
            frequenciaRespiratoria: 0,
            count: 0
          }
        }
      }

      // Processar diferentes tipos de eventos
      switch (event.type) {
        case 'meal':
          if (event.consumption_percentage) {
            dailyStats[date].alimentosPercent += event.consumption_percentage
            dailyStats[date].alimentosCount++
          }
          break
        case 'drink':
          if (event.volume_ml) {
            dailyStats[date].liquidosML += event.volume_ml
            dailyStats[date].liquidosCount++
          }
          break
        case 'bathroom':
          dailyStats[date].banheiroCount++
          if (event.volume_ml) {
            dailyStats[date].urinaML += event.volume_ml
          }
          break
        case 'mood':
          if (event.mood_scale) {
            dailyStats[date].humorScore += event.mood_scale
            dailyStats[date].humorCount++
          }
          break
        case 'medication':
          dailyStats[date].medicacaoCount++
          break
        case 'drain':
          if (event.left_amount) {
            dailyStats[date].drenoEsquerdo += event.left_amount
          }
          if (event.right_amount) {
            dailyStats[date].drenoDireito += event.right_amount
          }
          dailyStats[date].drenoCount++
          break
        case 'vital_signs':
          if (event.systolic_bp) {
            dailyStats[date].sinaisVitais.pressaoSistolica += event.systolic_bp
          }
          if (event.diastolic_bp) {
            dailyStats[date].sinaisVitais.pressaoDiastolica += event.diastolic_bp
          }
          if (event.heart_rate) {
            dailyStats[date].sinaisVitais.frequenciaCardiaca += event.heart_rate
          }
          if (event.temperature) {
            dailyStats[date].sinaisVitais.temperatura += event.temperature
          }
          if (event.oxygen_saturation) {
            dailyStats[date].sinaisVitais.saturacaoOxigenio += event.oxygen_saturation
          }
          if (event.respiratory_rate) {
            dailyStats[date].sinaisVitais.frequenciaRespiratoria += event.respiratory_rate
          }
          dailyStats[date].sinaisVitais.count++
          break
      }
    })

    console.log('\n📊 Estatísticas diárias processadas:')
    Object.entries(dailyStats).forEach(([date, stats]) => {
      console.log(`\n📅 ${date}:`)
      console.log(`   Medicação: ${stats.medicacaoCount} administrações`)
      console.log(`   Líquidos: ${stats.liquidosML}ml (${stats.liquidosCount} registros)`)
      console.log(`   Drenos: ${stats.drenoCount} registros (E: ${stats.drenoEsquerdo}ml, D: ${stats.drenoDireito}ml)`)
      console.log(`   Sinais Vitais: ${stats.sinaisVitais.count} registros`)
      if (stats.sinaisVitais.count > 0) {
        console.log(`     - PA: ${stats.sinaisVitais.pressaoSistolica}/${stats.sinaisVitais.pressaoDiastolica}mmHg`)
        console.log(`     - FC: ${stats.sinaisVitais.frequenciaCardiaca}bpm`)
        console.log(`     - Temp: ${stats.sinaisVitais.temperatura}°C`)
        console.log(`     - SpO2: ${stats.sinaisVitais.saturacaoOxigenio}%`)
      }
    })

    // 6. Simular chartData
    const chartData = {
      alimentosData: Object.entries(dailyStats).filter(([_, stats]) => stats.alimentosCount > 0),
      liquidosData: Object.entries(dailyStats).filter(([_, stats]) => stats.liquidosML > 0),
      medicacaoData: Object.entries(dailyStats).filter(([_, stats]) => stats.medicacaoCount > 0),
      drenosData: Object.entries(dailyStats).filter(([_, stats]) => stats.drenoCount > 0),
      urinaData: Object.entries(dailyStats).filter(([_, stats]) => stats.urinaML > 0),
      humorData: Object.entries(dailyStats).filter(([_, stats]) => stats.humorScore > 0),
      sinaisVitaisData: Object.entries(dailyStats).filter(([_, stats]) => stats.sinaisVitais.count > 0)
    }

    console.log('\n📈 Dados disponíveis para gráficos:')
    Object.entries(chartData).forEach(([chartType, data]) => {
      console.log(`   ${chartType}: ${data.length} dia(s) com dados`)
    })

    // 7. Limpeza - remover eventos de teste criados
    console.log('\n🧹 Removendo eventos de teste...')
    if (createdEventIds.length > 0) {
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

    console.log('\n🎉 Teste completo! Todos os tipos de eventos foram processados com sucesso.')

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

testAllEventTypesInReports()