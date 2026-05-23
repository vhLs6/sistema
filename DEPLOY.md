# Colocar o site no ar

Este projeto e um app Next.js com SQLite. Para outras pessoas usarem, hospede em um servico com disco persistente para o arquivo do banco.

## Opcao recomendada: Render

1. Crie um repositorio no GitHub e envie esta pasta para ele.
2. No Render, crie um **Web Service** conectado ao repositorio.
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: `Node`
4. Em **Environment Variables**, adicione:
   - `SESSION_SECRET`: uma chave grande e aleatoria
   - `DATABASE_PATH`: `/var/data/usuarios.sqlite`
5. Em **Disks**, adicione um disco persistente:
   - Mount Path: `/var/data`
6. Clique em **Deploy**.

Depois do deploy, o Render vai mostrar uma URL publica para acessar o site.

## Importante

Vercel e Netlify nao sao a melhor opcao para este app do jeito que ele esta, porque o banco SQLite precisa gravar dados em um arquivo persistente. Se quiser usar Vercel, o ideal e trocar o SQLite por um banco externo como Postgres.
