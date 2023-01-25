import {
  AckPolicy,
  connect,
  DeliverPolicy,
  nuid,
  PubAck,
} from "https://raw.githubusercontent.com/nats-io/nats.deno/js-s2/src/mod.ts";

const nc = await connect();

// create the consumer
const jsm = await nc.jetstreamManager();
const name = nuid.next();
const subj = `${name}.x`;
await jsm.streams.add({ name, subjects: [subj] });
await jsm.consumers.add(name, {
  durable_name: name,
  ack_policy: AckPolicy.None,
  deliver_policy: DeliverPolicy.All,
});

const js = nc.jetstream();
const buf: Promise<PubAck>[] = [];
const payload = new Uint8Array(10);
for (let i = 0; i < 100; i++) {
  buf.push(js.publish(subj, payload));
}
const consumer = await js.consumers.get(name, name);
console.log(await consumer.info());
//@ts-ignore: debug
nc.options.debug = true;
const msgs = await consumer.fetch({ max_bytes: 1024, expires: 10_000 });
for await (const r of msgs) {
  if (r.error) {
    console.log(r.error?.message);
  } else {
    console.log(r.value?.seq);
  }
}
await consumer.delete();
await nc.close();
