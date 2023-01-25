import {
  AckPolicy,
  connect,
  nuid,
} from "https://raw.githubusercontent.com/nats-io/nats.deno/js-s2/src/mod.ts";

const nc = await connect();

// create the consumer
const jsm = await nc.jetstreamManager();
const name = nuid.next();
await jsm.consumers.add("demo", {
  durable_name: name,
  ack_policy: AckPolicy.None,
});

const js = nc.jetstream();
const consumer = await js.consumers.get("demo", name);

let ok = true;
let bytes = 0;
let count = 0;
const start = Date.now();
while (ok) {
  const msgs = await consumer.fetch({ max_messages: 20_000, expires: 10_000 });
  for await (const r of msgs) {
    if (r.error) {
      console.log(r.error.message);
    } else {
      const m = r.value!;
      count++;
      bytes += m.data.length;
      if (m.seq % 50_000 === 0) {
        console.log(m?.seq);
      }
      if (m.info.pending === 0) {
        ok = false;
        console.log("all done");
        break;
      }
    }
  }
}

const time = parseInt(`${Date.now() - start}`);
console.log(
  `processed ${count} msgs in ${time}ms - ${
    ((count / time) * 1000).toFixed(0)
  } msgs/sec`,
);
console.log(
  `${bytes / 1_000_000}Mb - ${
    ((bytes / 1_000_000 / time) * 1000).toFixed(2)
  }Mb/sec`,
);

await consumer.delete();

await nc.close();
