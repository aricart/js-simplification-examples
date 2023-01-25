import {
  connect,
  PubAck,
  StorageType,
} from "https://raw.githubusercontent.com/nats-io/nats.deno/js-s2/src/mod.ts";

const nc = await connect();
const jsm = await nc.jetstreamManager();
await jsm.streams.add({
  name: "demo",
  subjects: ["demo.>"],
  storage: StorageType.File,
});

const js = nc.jetstream();
const data = new Uint8Array(128);
const proms: Promise<PubAck>[] = [];

const N = 1_000_000;

let block = 0;
let subj = `demo.${block}`;
console.log(`seeding ${subj}`);
for (let i = 0; i < N; i++) {
  proms.push(js.publish(subj, data));
  if (proms.length === 5_000) {
    await Promise.all(proms);
    proms.length = 0;
    block++;
    subj = `demo.${block}`;
    console.log(`seeding ${subj}`);
  }
}

if (proms.length) {
  await Promise.all(proms);
  proms.length = 0;
}

console.log(`added ${N} messages to "demo" stream`);
await nc.flush();
await nc.close();
