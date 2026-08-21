import { readdir } from "node:fs/promises";

const directory = new URL("./distribution/", import.meta.url);
const files = (await readdir(directory))
  .filter((file) => file.endsWith(".test.mjs"))
  .sort();

for (const file of files) await import(new URL(file, directory).href);
