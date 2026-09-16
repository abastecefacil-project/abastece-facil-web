# frontend-abastece-facil

Sistema web para consulta e gerenciamento dos postos conveniados da **FIESC / UNISENAI Joinville**.  
Repositório oficial: [Evolve-Cap/abastece-facil-frontend](https://github.com/Abastece-Facil/front-abastece-facil)

---

## Requisitos

- [Node.js](https://nodejs.org/) **v20.X** ou **>=22.12.0**   
- [npm](https://www.npmjs.com/) **v11+**

Recomenda-se o uso de [nvm](https://github.com/nvm-sh/nvm) para gerenciar versões do Node.

---

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/Abastece-Facil/front-abastece-facil
cd front-abastece-facil
npm install
```

---

## Variáveis de ambiente

O projeto requer variáveis configuradas em um arquivo `.env` na raiz.  
Exemplo:

```env
# URL base da API Backend (Spring Boot)
VITE_API_PROXY_TARGET="http://localhost:8081"
```

---

## Executando o projeto

### Ambiente de Desenvolvimento

Executa o servidor Vite com hot reload:

```bash
npm run dev
```

Aplicação disponível em [http://localhost:5173](http://localhost:5173)

### Ambiente de Produção

Gera o build otimizado para deploy:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

---

## Scripts Principais

| Comando | Descrição |
|----------|------------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Executa o build localmente |

---

## .gitignore

Principais exclusões:

```gitignore
node_modules/
dist/
.env
.env.*
```
O arquivo `.gitignore` completo está na raiz do repositório.

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
