import { Db, Collection, Document, ObjectId, Filter } from "mongodb";
import { Router } from "express";
import { z, ZodObject, ZodRawShape } from "zod";

const SkipLimitQuery = z.object({
  skip: z.optional(z.number()),
  limit: z.optional(z.number())
});

type Resource<T extends Document> = {
  router: Router;
  collection: Collection<T>;
};

/**
 * Creates a router with the following routes:
 * GET / - returns all documents
 * GET /:id - returns a single document
 * POST / - creates a new document
 * PUT /:id - updates a document
 * DELETE /:id - deletes a document
 *
 * Also mongodb collection
 *
 * @param Schema zod schema for the resource
 * @param db mongodb database
 * @param collectionName mongodb collection name
 * @returns Resource<Schema>
 */
export const createResource = <
  Schema extends ZodObject<ZodRawShape>,
  T extends z.infer<Schema>
>(
  Schema: Schema,
  db: Db,
  collectionName: string
): Resource<T> => {
  const collection = db.collection<T>(collectionName);
  const router = Router();

  // GET /
  router.get("/", async (req, res) => {
    const query = SkipLimitQuery.parse(req.query);
    let mongoQuery = collection.find();
    if (query.skip) {
      mongoQuery = mongoQuery.skip(query.skip);
    }
    if (query.limit) {
      mongoQuery = mongoQuery.limit(query.limit);
    }
    const docs = await mongoQuery.toArray();

    res.json(docs);
  });

  // GET /:id
  router.get("/:id", async (req, res) => {
    const id = z.string().parse(req.params.id);
    const doc = await collection.findOne({
      _id: new ObjectId(id)
    } as Filter<T>);
    console.log(id, doc);
    res.json(doc);
  });

  // POST /
  router.post("/", async (req, res) => {
    let parsed: T | null = null;
    try {
      parsed = Schema.parse(req.body) as any;
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json(e);
        return;
      }
    }
    const doc = await collection.insertOne(
      parsed as any /* OptionalUnlessRequiredId */
    );
    res.json(doc);
  });

  // PUT /:id
  router.put("/:id", async (req, res) => {
    const id = z.string().parse(req.params.id);
    let parsed: T | null = null;
    try {
      parsed = Schema.parse(req.body) as any;
    } catch (e) {
      if (e instanceof Error) {
        res.status(400).json(e);
        return;
      }
    }
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) } as Filter<T>,
      { $set: parsed as any }
    );
    res.json(result);
  });

  // DELETE /:id
  router.delete("/:id", async (req, res) => {
    const id = z.string().parse(req.params.id);
    const result = await collection.findOneAndDelete({
      _id: new ObjectId(id)
    } as Filter<T>);
    res.json(result);
  });

  return {
    router,
    collection
  };
};
