const global = window as any;

export const indexedDB: IDBFactory =
  global.indexedDB ||
  global.webkitIndexedDB ||
  global.mozIndexedDB ||
  global.msIndexedDB;

export const IDBTransaction: IDBTransaction =
  global.IDBTransaction ||
  global.webkitIDBTransaction ||
  global.msIDBTransaction;

export const IDBKeyRange: IDBKeyRange =
  global.IDBKeyRange ||
  global.webkitIDBKeyRange ||
  global.msIDBKeyRange;
