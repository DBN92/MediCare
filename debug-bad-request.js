// Script para adicionar logs detalhados de debug no addEvent
// Este script modifica temporariamente o useCareEvents.ts para capturar mais detalhes do erro

console.log('🔍 SCRIPT DE DEBUG PARA BAD REQUEST');
console.log('=====================================');

console.log(`
📋 INSTRUÇÕES PARA DEBUG:

1. Abra o navegador e vá para a aplicação
2. Abra as Ferramentas do Desenvolvedor (F12)
3. Vá para a aba "Console"
4. Tente salvar um registro que está dando "bad request"
5. Observe os logs detalhados no console

🔍 O que procurar no console:
- Mensagens de erro detalhadas
- Status code da requisição HTTP
- Dados sendo enviados para o Supabase
- Resposta do servidor

📝 Logs esperados:
- "🚀 Tentando inserir evento:" (dados do evento)
- "❌ Erro detalhado:" (detalhes do erro)
- "📊 Status da requisição:" (código HTTP)
- "📋 Resposta do servidor:" (resposta completa)

💡 Possíveis causas do "bad request":
1. Campos obrigatórios faltando
2. Tipos de dados incorretos
3. Valores inválidos para enums
4. Violação de constraints da base de dados
5. Problemas de autenticação/autorização

🛠️ Para resolver:
- Se for campo obrigatório: adicionar validação no frontend
- Se for tipo incorreto: corrigir conversão de dados
- Se for enum inválido: verificar valores permitidos
- Se for constraint: verificar regras da base de dados
- Se for auth: verificar se usuário está logado
`);

console.log('\n✅ Script de debug preparado!');
console.log('👆 Siga as instruções acima para identificar o problema.');