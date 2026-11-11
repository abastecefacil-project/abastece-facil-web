import { apiPrivate } from "./apiClient";
import { nomeArquivoExportacao } from "@/utils/exportacao";

// Baixa a planilha .xlsx de uma listagem do admin. Os params são os mesmos da
// listagem, sem page/size/sort: a exportação traz tudo que o filtro alcança.
export async function baixarExportacao(caminho, params, entidade) {
    const response = await apiPrivate.get(caminho, { params, responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivoExportacao(response.headers['content-disposition'], entidade);
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revogar logo após o click pode cancelar o download no Firefox.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
