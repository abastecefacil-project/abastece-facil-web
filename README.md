# Frontend Abastece Fácil

Sistema web para consulta e gerenciamento dos postos conveniados da **FIESC / UNISENAI Joinville**.  
Repositório oficial: [abastecefacil-project/abastece-facil-web](https://github.com/abastecefacil-project/abastece-facil-web)

---

## Rodar localmente

Pré-requisitos: Node.js 20 e npm. Inicie primeiro a API e o banco seguindo o
[guia rápido do backend](https://github.com/abastecefacil-project/abastece-facil-api#rodar-localmente-recomendado).
O endereço padrão da API é `http://localhost:8081`.

No diretório do frontend, execute:

```bash
cp .env.example .env
npm ci
npm run dev
```

No PowerShell, copie o exemplo com `Copy-Item .env.example .env`. A configuração padrão
encaminha as chamadas `/api` para `http://localhost:8081`; se a API estiver em outro
endereço, ajuste `VITE_API_PROXY_TARGET` no `.env`. Deixe `VITE_API_BASE_URL` vazia no
desenvolvimento local; se frontend e API forem publicados em origens diferentes, use ali
somente a origem da API, sem acrescentar `/api`.

Abra [http://localhost:5173](http://localhost:5173).

Para entrar no ambiente local, use as contas e senhas de desenvolvimento documentadas
no README do backend. Elas não devem ser usadas em produção.

## Build de produção

```bash
npm run build
npm run preview
```

### Contato da gestão de frota

A Central de Ajuda consulta os gestores ativos da regional do usuário logado em
`GET /api/users/me/gestores-frota`. Nome e telefone vêm do cadastro de usuários.
O telefone com DDD gera um link de WhatsApp; sem telefone válido, o contato é
exibido sem link. Se houver mais de um gestor, todos são listados.
Não há configuração de número por variável de ambiente.

---

## Tecnologias Utilizadas

- [Vue 3](https://vuejs.org/)  
- [Vite](https://vitejs.dev/)  
- [Pinia](https://pinia.vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)    
- [Axios](https://axios-http.com/)   
- [Leaflet](https://leafletjs.com/) + [OpenStreetMap](https://www.openstreetmap.org/)   

---

## Licença

Este projeto é **privado**.
Uso restrito a colaboradores autorizados.
