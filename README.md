# frontend-abastece-facil

Sistema web para consulta e gerenciamento dos postos conveniados da **FIESC / UNISENAI Joinville**.  
Repositório oficial: [abastecefacil-project/abastece-facil-web](https://github.com/abastecefacil-project/abastece-facil-web)

---

## Requisitos

- [Node.js](https://nodejs.org/) **v20.X**
- npm incluído na instalação do Node.js

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
# URL base usada pelo frontend; o Vite encaminha /api para a API local
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET="http://localhost:8081"

# WhatsApp da gestora de frota, exibido na Central de Ajuda (opcional)
VITE_WHATSAPP_SUPORTE=
```

### `VITE_WHATSAPP_SUPORTE`

Número institucional da gestora de frota. Na Central de Ajuda, o item "Gestora de
Frota" vira um link que abre o WhatsApp (app ou WhatsApp Web) na conversa com esse
número, com uma mensagem inicial pronta.

- Formato: **só dígitos, com país e DDD**, 12 ou 13 dígitos começando com `55`
  (ex.: `5547999999999`). Máscara como `+55 (47) 99999-9999` também é aceita.
- Vazia ou inválida: o item continua como texto, sem link, e o console do navegador
  mostra um aviso uma vez por carga de página.
- **Não versione o número real.** Em desenvolvimento, coloque-o no `.env.local`
  (ignorado pelo Git).

Como toda variável `VITE_*`, ela é embutida no bundle **no momento do build**: mudar
o valor exige gerar a imagem de novo. O `.dockerignore` exclui os arquivos `.env*`,
então no Docker o valor chega por argumento de build:

```bash
docker build --build-arg VITE_WHATSAPP_SUPORTE=5547999999999 -t abastece-facil-web .
```

No Docker Compose:

```yaml
services:
  web:
    build:
      context: .
      args:
        VITE_WHATSAPP_SUPORTE: ${VITE_WHATSAPP_SUPORTE}
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
