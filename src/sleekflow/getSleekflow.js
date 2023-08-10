const axios = require('axios');
require('dotenv').config();
const fs = require('fs');

const { Client } = require('pg');

const postgresConfig = {
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
};

const client = new Client(postgresConfig);

async function connectToPostgres() {
  try {
    await client.connect(); // Connect to PostgreSQL
    console.log('Connected to PostgreSQL');
  } catch (err) {
    console.error('Error while connecting to PostgreSQL:', err);
  }
}

async function disconnectFromPostgres() {
  try {
    await client.end();
    console.log('Disconnected from PostgreSQL');
  } catch (err) {
    console.error('Error while disconnecting from PostgreSQL:', err);
  }
}

async function updateLabel() {
  let contactsWithOrderUpdated = [];
  try {

    connectToPostgres()
    const database = await client.query(
      `SELECT situacao, situacao_antiga, CONCAT('55', REGEXP_REPLACE(telefone, '[^0-9]', '', 'g')) AS telefone FROM ecommerce.situacao_pedidos WHERE telefone != '' and situacao != situacao_antiga and char_length(CONCAT('55', REGEXP_REPLACE(telefone, '[^0-9]', '', 'g'))) = 13`
    );

    const rowsOfDatabase = database.rows;

    rowsOfDatabase.forEach((row) => {
      const bancoEmail = row.email;
      const bancoTelefone = row.telefone;
      const bancoSituacao = row.situacao;
      console.log(bancoTelefone, bancoTelefone, '<==');
        contactsWithOrderUpdated.push({ PhoneNumber: bancoTelefone, addLabels: [bancoSituacao], Email: bancoEmail });
      
    });
    disconnectFromPostgres()

    fs.writeFile('contatosUpdateds.json', JSON.stringify(contactsWithOrderUpdated, null, 2), 'utf-8', (err) => {
      if (err) {
        console.error('Error while writing the file:', err);
      } else {
        console.log('JSON file saved successfully!');
      }
    })
    postLabel(contactsWithOrderUpdated)

  } catch (err) {
    console.error('Error while getting contacts:', err);
    return;
  }
}

async function postLabel(data) {
  const options = {
    method: 'POST',
    url: 'https://api.sleekflow.io/api/contact/addOrUpdate',
    params: { apikey: process.env.TOKEN_SLEEKFLOW },
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    data: data,
  };

  try {
    const { data } = await axios.request(options);
    console.log(data);
    console.log('The labels have been sented!')

  } catch (error) {
    console.error('Error while posting labels:', error);
  }
}

module.exports = { updateLabel }