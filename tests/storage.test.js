import { test, assert, assertEqual } from "./harness.js";
import { createStorage, memoryBackend } from "../src/storage.js";

test("set + get round-trips a JSON-serializable value", () => {
  const s = createStorage(memoryBackend());
  s.set("tasks", [{ id: "t_1", title: "x" }]);
  assertEqual(s.get("tasks"), [{ id: "t_1", title: "x" }]);
});

test("get returns the fallback when key is missing", () => {
  const s = createStorage(memoryBackend());
  assertEqual(s.get("missing", []), []);
  assertEqual(s.get("missing", null), null);
});

test("get tolerates corrupt JSON without throwing", () => {
  const backend = memoryBackend();
  backend.setItem("prism-planner:v1:tasks", "{not valid json");
  const s = createStorage(backend);
  assertEqual(s.get("tasks", []), []);
});

test("namespacing isolates planner keys from foreign keys", () => {
  const backend = memoryBackend();
  backend.setItem("tasks", JSON.stringify(["foreign"]));
  const s = createStorage(backend);
  assertEqual(s.get("tasks", []), []);
});

test("set returns false when the backend throws", () => {
  const failing = {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
    removeItem: () => {},
  };
  const s = createStorage(failing);
  assertEqual(s.set("tasks", []), false);
});

test("set returns false when the value is not JSON-serializable", () => {
  const s = createStorage(memoryBackend());
  const circular = {};
  circular.self = circular;
  assertEqual(s.set("tasks", circular), false);
});

test("get returns the fallback when the backend throws on read", () => {
  const failing = {
    getItem: () => {
      throw new Error("private mode");
    },
    setItem: () => {},
    removeItem: () => {},
  };
  const s = createStorage(failing);
  assertEqual(s.get("tasks", []), []);
});

test("remove returns false when the backend throws", () => {
  const failing = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {
      throw new Error("locked");
    },
  };
  const s = createStorage(failing);
  assertEqual(s.remove("tasks"), false);
});

test("remove deletes a stored key", () => {
  const s = createStorage(memoryBackend());
  s.set("tasks", [1, 2, 3]);
  assert(s.remove("tasks"));
  assertEqual(s.get("tasks", null), null);
});
