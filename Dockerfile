# Etapa 1: Build 
FROM node:20-alpine AS build

# Variáveis do Nixpacks
ARG NIXPACKS_PATH=.
ENV NIXPACKS_PATH=$NIXPACKS_PATH 

# Argumentos para variáveis de ambiente de produção
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_OPENAI_API_KEY
ARG VITE_MEMED_API_KEY
ARG VITE_MEMED_SECRET_KEY
ARG VITE_GOOGLE_VISION_API_KEY

# Define as variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_MEMED_API_KEY=$VITE_MEMED_API_KEY
ENV VITE_MEMED_SECRET_KEY=$VITE_MEMED_SECRET_KEY
ENV VITE_MEMED_BASE_URL=https://api.memed.com.br/v1
ENV VITE_MEMED_ENVIRONMENT=production
ENV VITE_GOOGLE_VISION_API_KEY=$VITE_GOOGLE_VISION_API_KEY
ENV VITE_APP_ENV=production

WORKDIR /app 

# Copia arquivos de dependências primeiro para cache otimizado
COPY package*.json ./ 
RUN npm ci --only=production --silent

# Copia código fonte
COPY . . 

# Executa build de produção
RUN npm run build 

# Etapa 2: Nginx 
FROM nginx:alpine 

# Instala curl para healthcheck 
RUN apk add --no-cache curl 

# Remove config padrão e adiciona a nossa 
RUN rm /etc/nginx/conf.d/default.conf 
COPY nginx.conf /etc/nginx/conf.d/ 

# Copia build do React/Vite 
COPY --from=build /app/dist /usr/share/nginx/html 

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Define permissões corretas
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

EXPOSE 80 

# Healthcheck explícito 
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -f http://localhost/ || exit 1 

# Executa como usuário não-root
USER nginx

CMD ["nginx", "-g", "daemon off;"]