#!/usr/bin/env node

/**
 * Script para testar a correção do problema Mixed Content
 * Verifica se o WebSocket funciona corretamente após as mudanças
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente de produção
dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testando correção do Mixed Content...\n');

console.log('📋 Configuração:');
console.log(`- Supabase URL: ${supabaseUrl}`);
console.log(`- Anon Key: ${supabaseAnonKey?.substring(0, 20)}...`);

// Criar cliente Supabase com configuração de realtime
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    transport: 'websocket',
    timeout: 20000
  },
  global: {
    headers: {
      'x-application-name': 'medicare-v1'
    }
  }
});

async function testMixedContentFix() {
  try {
    console.log('\n🧪 Teste 1: Conexão básica com API');
    const { data: healthCheck, error: healthError } = await supabase
      .from('events')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Erro na conexão API:', healthError.message);
    } else {
      console.log('✅ Conexão API funcionando');
    }

    console.log('\n🧪 Teste 2: Configuração do WebSocket');
    const wsUrl = supabaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    console.log(`- WebSocket URL esperada: ${wsUrl}/realtime/v1/websocket`);
    
    // Verificar se a URL está sendo construída corretamente
    if (supabaseUrl.startsWith('https://')) {
      console.log('✅ HTTPS detectado - WebSocket usará WSS automaticamente');
    } else if (supabaseUrl.startsWith('http://')) {
      console.log('⚠️  HTTP detectado - WebSocket usará WS (pode causar Mixed Content em HTTPS)');
    }

    console.log('\n🧪 Teste 3: Tentativa de conexão Realtime');
    
    // Criar um canal de teste
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        (payload) => {
          console.log('📡 Evento recebido:', payload);
        }
      );

    // Tentar se inscrever
    const subscriptionResult = await new Promise((resolve) => {
      channel.subscribe((status) => {
        console.log(`📡 Status da inscrição: ${status}`);
        resolve(status);
      });
      
      // Timeout após 10 segundos
      setTimeout(() => {
        resolve('TIMEOUT');
      }, 10000);
    });

    if (subscriptionResult === 'SUBSCRIBED') {
      console.log('✅ WebSocket conectado com sucesso!');
    } else if (subscriptionResult === 'TIMEOUT') {
      console.log('⏰ Timeout na conexão WebSocket (pode indicar problema Mixed Content)');
    } else {
      console.log(`❌ Falha na conexão WebSocket: ${subscriptionResult}`);
    }

    // Limpar
    await supabase.removeChannel(channel);

  } catch (error) {
    console.log('❌ Erro durante os testes:', error.message);
  }
}

console.log('\n🚀 Iniciando testes...');
testMixedContentFix().then(() => {
  console.log('\n📊 Testes concluídos');
  console.log('\n💡 Próximos passos:');
  console.log('1. Se WebSocket falhou, o problema Mixed Content persiste');
  console.log('2. Considere usar um proxy HTTPS ou configurar SSL no Supabase');
  console.log('3. Alternativamente, desabilite realtime em produção HTTPS');
  process.exit(0);
});