import { MongoClient } from "mongodb";
import Express from "express";
import { createResource } from "./createResource";
import { Post } from "./post";

async function main() {
  const url = "mongodb://root:root@localhost:27017";
  const client = new MongoClient(url);
  const dbName = "test";
  await client.connect();
  const db = client.db(dbName);

  const app = Express();
  app.use(Express.json({}));

  const resourceName = "posts";

  const resource = createResource(Post, db, resourceName);
  app.use("/" + resourceName, resource.router);

  app.listen(3000, () => {
    console.log("Listening on port 3000");
  });
}

main();
