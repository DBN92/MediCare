# ========================== 
# Etapa de build 
# ========================== 
FROM node:20-slim AS build 

# Diretório de trabalho 
WORKDIR /app 

# Copia apenas os arquivos de dependências primeiro (melhora cache do Docker) 
COPY package*.json ./ 

# Instala todas as dependências (incluindo devDependencies, necessário pro Vite) 
RUN npm ci --legacy-peer-deps --no-audit --no-fund 

# Copia o restante do código 
COPY . . 

# Executa o build 
RUN npm run build 

# ========================== 
# Etapa de produção 
# ========================== 
FROM node:20-slim AS production 

WORKDIR /app 

# Copia apenas os arquivos de dependências 
COPY package*.json ./ 

# Instala apenas dependências de produção 
RUN npm ci --omit=dev --no-audit --no-fund 

# Copia o build da etapa anterior 
COPY --from=build /app/dist ./dist 

# Se você tiver pastas públicas, descomente: 
# COPY --from=build /app/public ./public 

# Expõe a porta (ajuste se não for 3000) 
EXPOSE 3000 

# Comando para iniciar (ajuste conforme seu package.json) 
CMD ["npm", "run", "preview"]