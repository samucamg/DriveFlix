import { Cipher } from '@fyears/rclone-crypt';

// Configurações do Rclone
const fileMagicSize = 8;
const fileNonceSize = 24;
const fileHeaderSize = fileMagicSize + fileNonceSize; // 32 bytes
const blockDataSize = 64 * 1024; // 65536 bytes
const blockHeaderSize = 16;
const blockSize = blockDataSize + blockHeaderSize; // 65552 bytes

const fileMagicBytes = new Uint8Array([82, 67, 76, 79, 78, 69, 0, 0]);

function compArr(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Incrementa o nonce como um Little-Endian inteiro gigante
function increment(nonce: Uint8Array) {
  let carry = 1;
  for (let i = 0; i < nonce.length; i++) {
    const sum = nonce[i] + carry;
    nonce[i] = sum & 0xff;
    carry = sum >> 8;
    if (carry === 0) break;
  }
}

import nacl from 'tweetnacl';

export function createDecryptStream(cipher: any) {
  let buffer = new Uint8Array(0);
  let isHeaderParsed = false;
  let nonce = new Uint8Array(fileNonceSize);

  return new TransformStream({
    transform(chunk, controller) {
      // 1. Adiciona o chunk atual ao buffer
      const newBuffer = new Uint8Array(buffer.length + chunk.length);
      newBuffer.set(buffer);
      newBuffer.set(chunk, buffer.length);
      buffer = newBuffer;

      // 2. Tenta processar o Header se ainda não foi feito
      if (!isHeaderParsed) {
        if (buffer.length >= fileHeaderSize) {
          const magic = buffer.slice(0, fileMagicSize);
          if (!compArr(magic, fileMagicBytes)) {
            controller.error(new Error('Bad magic number - Not an rclone encrypted file'));
            return;
          }
          nonce = buffer.slice(fileMagicSize, fileHeaderSize);
          isHeaderParsed = true;
          // Remove o header do buffer
          buffer = buffer.slice(fileHeaderSize);
        } else {
          // Precisa de mais dados para o header
          return;
        }
      }

      // 3. Processa blocos inteiros enquanto tivermos dados suficientes
      while (buffer.length >= blockSize) {
        const block = buffer.slice(0, blockSize);
        buffer = buffer.slice(blockSize);

        try {
          const decryptedBlock = nacl.secretbox.open(block, nonce, cipher.dataKey);
          if (!decryptedBlock) throw new Error("Bad block MAC");
          
          controller.enqueue(decryptedBlock);
          increment(nonce);
        } catch (e) {
          controller.error(e);
          return;
        }
      }
    },
    flush(controller) {
      // Processa o último bloco (que pode ser menor que blockSize)
      if (buffer.length > 0) {
        try {
          const decryptedBlock = nacl.secretbox.open(buffer, nonce, cipher.dataKey);
          if (!decryptedBlock) throw new Error("Bad block MAC (last block)");
          controller.enqueue(decryptedBlock);
        } catch (e) {
          controller.error(e);
        }
      }
    }
  });
}
