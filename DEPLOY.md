# Colocar o site no ar com Supabase + Render

Este projeto usa Next.js no Render e Postgres no Supabase.

## 1. Criar o banco no Supabase

1. Entre em `https://supabase.com`.
2. Clique em **New project**.
3. Escolha um nome, crie uma senha do banco e aguarde o projeto ficar pronto.
4. No painel do projeto, va em **Project Settings** > **Database**.
5. Copie a connection string do Postgres.
6. Troque `[YOUR-PASSWORD]` pela senha que voce criou.

Ela vai parecer com isto:

```text
postgresql://postgres.sua-ref:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

## 2. Configurar no Render

No seu Web Service do Render, adicione estas variaveis em **Environment Variables**:

```text
SESSION_SECRET=uma-chave-grande-e-aleatoria
DATABASE_URL=sua-connection-string-do-supabase
```

Depois use:

```text
Build Command: npm install && npm run build
Start Command: npm start
```

## 3. Deploy

Clique em **Deploy** no Render. As tabelas do banco sao criadas automaticamente na primeira vez que o site acessar o Supabase.

Agora os dados ficam no Supabase, entao eles nao somem quando o Render reinicia ou faz redeploy.
