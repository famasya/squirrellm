import { db } from "./app/lib/db";
import { messages as messagesTable } from "./app/lib/db.schema";

await db.insert(messagesTable).values({
  id: '1888764876159979522',
  role: 'user',
  createdAt: 1739151612713,
  content: 'hi',
  model: 'qwen/qwen-vl-plus:free',
  sessionId: '1888764874540978187'
}).then((res) => {
  console.log(res);
});
