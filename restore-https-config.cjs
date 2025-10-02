#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Restaurando configuração HTTPS...');

try {
  if (fs.existsSync('.env.https.backup')) {
    fs.copyFileSync('.env.https.backup', '.env');
    console.log('✅ .env restaurado');
  }
  
  if (fs.existsSync('.env.production.https.backup')) {
    fs.copyFileSync('.env.production.https.backup', '.env.production');
    console.log('✅ .env.production restaurado');
  }
  
  console.log('🎯 Configuração HTTPS restaurada. Reinicie o servidor.');
} catch (error) {
  console.error('❌ Erro ao restaurar:', error.message);
}
