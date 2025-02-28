import { crypto } from "jsr:@std/crypto";
import blueimpMd5 from "https://cdn.skypack.dev/blueimp-md5@2.19.0";

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

// we just need this to be fast but not super random
function createRandomUint8Array(arrayLength: number) {
    const blockSize = 65536;
    const array = new Uint8Array(arrayLength);
    for (let i = 0; i < blockSize; i++) {
        array[i] = getRandomInt(0, 256);
    }
    // Then, just copy the first block to the rest of the array
    for (let i = 1; i < ~~(arrayLength / blockSize); i++) {
        array.set(array.subarray(0, blockSize), i * blockSize);
    }
    return array;
}

const bench = async (fn: () => Promise<unknown>, repeat = 1, minTime = 100): Promise<number> => {
    const start = performance.now();
    let i = 0;
    do {
        await fn();
        i++;
    } while (performance.now() - start < minTime || i < repeat);
    const end = performance.now();
    return (end - start) / i;
}

async function ourHash(content: string) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) + hash + char;
      hash &= hash;
    }
    return new Uint32Array([hash])[0].toString(36);
}

async function dumbHash(content: string) {
    let hash = 0;
    for (let i = 0; i < content.length; i+=7) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) + hash + char;
      hash &= hash;
    }
    for (let i = 0; i < content.length; i+=13) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) + hash + char;
      hash &= hash;
    }
    return new Uint32Array([hash])[0].toString(36);
}

async function blueimpMd5Hash(content: string) {
    const result = blueimpMd5(content);
    return result;
}

const nRepeats = 5;
console.log("size_log2, sha256, md5, quarto, blueimp-md5, dumb");
for (let i = 6; i < 24; ++i) {
    let bufferLength = 1 << i;
    const largeBuffer = createRandomUint8Array(bufferLength);
    const largeString = new TextDecoder().decode(largeBuffer);
    const sha256 = await bench(() => crypto.subtle.digest("SHA-256", largeBuffer), nRepeats);
    const md5 = await bench(() => crypto.subtle.digest("MD5", largeBuffer), nRepeats);
    const ours = await bench(() => ourHash(largeString), nRepeats);
    const blueimp = await bench(() => blueimpMd5Hash(largeString), nRepeats);
    const dumb = await bench(() => dumbHash(largeString), nRepeats);
    console.log(`${i}, ${sha256}, ${md5}, ${ours}, ${blueimp}, ${dumb}`);
}

// console.log(`generating ${bufferLength} string...`);
// console.log(`done in ${time}ms`);
// const printBenchOutput = (output: { name: string, time: number }[]) => {
//     output.sort((a, b) => a.time - b.time).forEach(({ name, time }) => {
//         console.log(`${name}: ${time}ms`);
//     });
// }
// printBenchOutput([
//     await bench(() => crypto.subtle.digest("SHA-256", largeBuffer), "SHA-256"),
//     await bench(() => crypto.subtle.digest("MD5", largeBuffer), "MD5"),
//     await bench(() => ourHash(largeString), "quarto"),
//     await bench(() => blueimpMd5Hash(largeString), "blueimp-md5")
// ]);
