# Como Publicar na Vercel 🚀

Siga estes passos para colocar seu sistema no ar:

## 1. Verifique o Build
Certifique-se de que o projeto compila sem erros (eu já rodei o teste para você):
```bash
npm run build
```

## 2. Envie para o GitHub
Seu código precisa estar no GitHub. Se ainda não estiver:
```bash
git add .
git commit -m "Preparando para deploy"
git push
```

## 3. Importe na Vercel
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard).
2. Clique em **"Add New..."** -> **"Project"**.
3. Selecione o repositório do seu projeto.
4. Clique em **"Import"**.

## 4. Configuração do Projeto
A Vercel deve detectar que é um projeto **Vite** automaticamente.
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## 5. Variáveis de Ambiente (MUITO IMPORTANTE) 🔑
Você **PRECISA** adicionar as chaves do Supabase para o site funcionar.
Na tela de importação (ou em Settings > Environment Variables), adicione:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://uqhuqsvlcnvleobwdpga.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_CWRxgk-QUYMaKLO_IZfFEg_RDDZnfni` |

*(Esses valores estão no seu arquivo `.env` local)*

## 6. Deploy
Clique em **"Deploy"**. Aguarde alguns segundos e seu site estará no ar! 🎉
