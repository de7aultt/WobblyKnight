import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, inflateRawSync } from 'node:zlib';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const distDirectory = join(projectRoot, 'dist');
const outputPath = join(projectRoot, 'wobbly-knight-web.zip');
const skipBuild = process.argv.includes('--skip-build');

const LOCAL_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const END_RECORD_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const METHOD_STORED = 0;
const METHOD_DEFLATED = 8;
const ZIP_VERSION = 20;

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function fail(message) {
  console.error(`pack: ${message}`);
  process.exit(1);
}

function runBuild() {
  const result = spawnSync('npm run build', { cwd: projectRoot, stdio: 'inherit', shell: true });
  if (result.status !== 0) fail('production build failed');
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .sort((first, second) => first.name.localeCompare(second.name))
    .flatMap((entry) => {
      const fullPath = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
    });
}

function toDosDateTime(date) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, day };
}

function createEntry(filePath) {
  const name = relative(distDirectory, filePath).split(sep).join('/');
  const data = readFileSync(filePath);
  const deflated = deflateRawSync(data, { level: 9 });
  const useDeflate = deflated.length < data.length;
  return {
    name: Buffer.from(name, 'utf8'),
    displayName: name,
    crc: crc32(data),
    uncompressedSize: data.length,
    payload: useDeflate ? deflated : data,
    method: useDeflate ? METHOD_DEFLATED : METHOD_STORED,
    ...toDosDateTime(statSync(filePath).mtime)
  };
}

function createLocalHeader(entry) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(LOCAL_HEADER_SIGNATURE, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(UTF8_FLAG, 6);
  header.writeUInt16LE(entry.method, 8);
  header.writeUInt16LE(entry.time, 10);
  header.writeUInt16LE(entry.day, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.payload.length, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(entry.name.length, 26);
  header.writeUInt16LE(0, 28);
  return header;
}

function createCentralHeader(entry, offset) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(CENTRAL_HEADER_SIGNATURE, 0);
  header.writeUInt16LE(ZIP_VERSION, 4);
  header.writeUInt16LE(ZIP_VERSION, 6);
  header.writeUInt16LE(UTF8_FLAG, 8);
  header.writeUInt16LE(entry.method, 10);
  header.writeUInt16LE(entry.time, 12);
  header.writeUInt16LE(entry.day, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.payload.length, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt32LE(offset, 42);
  return header;
}

function buildArchive(entries) {
  const chunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of entries) {
    const localHeader = createLocalHeader(entry);
    centralChunks.push(createCentralHeader(entry, offset), entry.name);
    chunks.push(localHeader, entry.name, entry.payload);
    offset += localHeader.length + entry.name.length + entry.payload.length;
  }

  const centralDirectory = Buffer.concat(centralChunks);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(END_RECORD_SIGNATURE, 0);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralDirectory, endRecord]);
}

function verifyArchive(archive) {
  const endOffset = archive.length - 22;
  if (archive.readUInt32LE(endOffset) !== END_RECORD_SIGNATURE) fail('archive end record is missing');
  const count = archive.readUInt16LE(endOffset + 10);
  let cursor = archive.readUInt32LE(endOffset + 16);
  const names = [];

  for (let index = 0; index < count; index++) {
    if (archive.readUInt32LE(cursor) !== CENTRAL_HEADER_SIGNATURE) fail('central directory is corrupt');
    const method = archive.readUInt16LE(cursor + 10);
    const crc = archive.readUInt32LE(cursor + 16);
    const compressedSize = archive.readUInt32LE(cursor + 20);
    const nameLength = archive.readUInt16LE(cursor + 28);
    const localOffset = archive.readUInt32LE(cursor + 42);
    const name = archive.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    const localNameLength = archive.readUInt16LE(localOffset + 26);
    const dataStart = localOffset + 30 + localNameLength;
    const payload = archive.subarray(dataStart, dataStart + compressedSize);
    const data = method === METHOD_DEFLATED ? inflateRawSync(payload) : payload;
    if (crc32(data) !== crc) fail(`checksum mismatch for ${name}`);
    names.push(name);
    cursor += 46 + nameLength;
  }

  if (!names.includes('index.html')) fail('index.html is not in the archive root');
  if (names.some((name) => name.startsWith('dist/'))) fail('archive entries must not be nested in dist/');
  return names;
}

if (!skipBuild) runBuild();
if (!existsSync(join(distDirectory, 'index.html'))) fail('dist/index.html was not found, run the build first');

const entries = listFiles(distDirectory)
  .map(createEntry)
  .sort((first, second) => Number(second.displayName === 'index.html') - Number(first.displayName === 'index.html'));
const archive = buildArchive(entries);
const names = verifyArchive(archive);
writeFileSync(outputPath, archive);

console.log(`pack: wrote ${outputPath} (${archive.length} bytes, ${names.length} files)`);
names.forEach((name) => console.log(`  ${name}`));
