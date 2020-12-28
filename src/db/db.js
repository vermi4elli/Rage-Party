'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

const getScores = (request, response) => {
  client.query('select name, score from scores;', (error, results) => {
    if (error) {
      throw error;
    }
    response.status(200).json(results.rows);
  });
};

const getUserByName = (request, response) => {
  const name = request.params.name;
  client.query(`select * from scores where name = ${1}`,
    [name], (error, results) => {
      if (error) {
        throw error;
      }
      response.status(200).json(results.rows);
    });
};

const createUserScore = (request, response) => {
  const { name, score } = request.body;
  client.query(
    `insert into scores (name, score) VALUES (${1}, ${2})`,
    [name, score],
    (error, result) => {
      if (error) {
        throw error;
      }
      console.log('request', request);
      response.status(200).send(`User added with ID: ${result.id}`);
    }
  );
};

module.exports = {
  getScores,
  createUserScore,
  getUserByName
};
