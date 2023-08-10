const { getPhoneNumber } = require("./tiny/orderProcessor");
const getSituacao = require('./tiny/getLastOrders');
const { updateLabel } = require('./sleekflow/getSleekflow');

async function main() {
    try {
        // Executa a função para obter números de telefone (consulta na API do TINY contato por contato)
        // await getPhoneNumber();

        // Executa a função para atualizar a situação dos contatos usando a API de pedidos do TINY
        // await getSituacao();

        // Executa a função para criar uma nova label nos contatos com pedidos usando a API do Sleekflow
        await updateLabel();

        console.log("Processo concluído com sucesso!");
    } catch (error) {
        console.error("Ocorreu um erro durante o processo:", error);
    }
}

main();
