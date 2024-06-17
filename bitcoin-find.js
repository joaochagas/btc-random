import CoinKey from 'coinkey';
import walletsArray from './wallets.js';
import chalk from 'chalk';
import fs from 'fs';
import crypto from 'crypto';
import { exec } from 'child_process';

const walletsSet = new Set(walletsArray);

async function encontrarBitcoins(key, min, max, shouldStop, rand = 0) {
  let segundos = 0;
  let pkey = 0;
  let um = 0;
  if (rand === 0) {
    um = BigInt(1);
  } else {
    um = BigInt(rand);
  }

  const startTime = Date.now();

  let zeroes = new Array(65).fill('');
  for (let i = 1; i < 64; i++) {
    zeroes[i] = '0'.repeat(64 - i);
  }

  console.log('Buscando Bitcoins...');

  key = getRandomBigInt(min, max);

  const executeLoop = async () => {
    try {
      while (!shouldStop()) {
        key += um;
        pkey = key.toString(16);
        pkey = `${zeroes[pkey.length]}${pkey}`;

        if (Date.now() - startTime > segundos) {
          segundos += 1000;
          console.log(segundos / 1000);
          if (segundos % 10000 === 0) {
            const tempo = (Date.now() - startTime) / 1000;
            console.clear();
            console.log('Resumo: ');
            console.log('Última chave tentada: ', pkey);

            const filePath = 'Ultima_chave.txt';  // Caminho do arquivo para escrever
            const content = `Última chave tentada: ${pkey}`;
            try {
              fs.writeFileSync(filePath, content, 'utf8');
            } catch (err) {
              console.error('Erro ao escrever no arquivo:', err);
            }

            key = getRandomBigInt(min, max);

            if (key >= max) {
              key = min;
            }
          }
        }

        let publicKey = generatePublic(pkey);
        if (walletsSet.has(publicKey)) {
          const tempo = (Date.now() - startTime) / 1000;
          console.log('Velocidade:', (Number(key) - Number(min)) / tempo, ' chaves por segundo');
          console.log('Tempo:', tempo, ' segundos');
          console.log('Private key:', chalk.green(pkey));
          console.log('WIF:', chalk.green(generateWIF(pkey)));

          const filePath = 'keys.txt';
          const lineToAppend = `Private key: ${pkey}, WIF: ${generateWIF(pkey)}\n`;

          try {
            fs.appendFileSync(filePath, lineToAppend);
            console.log('Chave escrita no arquivo com sucesso.');
          } catch (err) {
            console.error('Erro ao escrever chave em arquivo:', err);
          }

          // Emitir som de alerta
          exec('powershell [console]::beep(1000,500)');

          throw new Error('ACHEI!!!! 🎉🎉🎉🎉🎉');
        }
      }
    } catch (err) {
      if (err.message === 'ACHEI!!!! 🎉🎉🎉🎉🎉') {
        console.log(err.message);
      } else {
        console.error('Erro inesperado:', err);
      }
    }
    await new Promise(resolve => setImmediate(resolve));
  }
  await executeLoop();
}

function generatePublic(privateKey) {
  let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
  _key.compressed = true;
  return _key.publicAddress;
}

function generateWIF(privateKey) {
  let _key = new CoinKey(Buffer.from(privateKey, 'hex'));
  return _key.privateWif;
}

function getRandomBigInt(min, max) {
  if (min >= max) {
    throw new Error('min should be less than max');
  }

  // Calcular o intervalo
  const range = max - min;

  // Gerar um BigInt aleatório dentro do intervalo
  const randomBigIntInRange = BigInt(`0x${crypto.randomBytes(32).toString('hex')}`) % range;

  // Adicionar o valor mínimo para obter um número dentro do intervalo desejado
  const randomBigInt = min + randomBigIntInRange;

  return randomBigInt;
}

export default encontrarBitcoins;
