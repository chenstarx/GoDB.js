import GodbClass from '../godb';
import GodbTableClass from '../table';

type PrimitiveType = number | string | boolean | null;
type GodbDataType = PrimitiveType | object;

export type Godb = GodbClass;

export type GodbTable = GodbTableClass;

export interface GodbData {
  id: number,
  [key: string]: GodbDataType | Array<GodbDataType>
}

export interface GodbInputData {
  [key: string]: GodbDataType | Array<GodbDataType>
}

// some problems here
export interface GodbTableSearch {
  [key: string]: number | string
}

export type GetDBCallback = (idb: IDBDatabase) => void;

export type TableFindFunction = (item?: GodbData) => boolean;

export type TableIndexTypes =
  NumberConstructor
  | StringConstructor
  | BooleanConstructor
  | DateConstructor
  | ObjectConstructor
  | ArrayConstructor;

export interface TableIndex {
  type: TableIndexTypes
  unique?: boolean
  default?: any
  ref?: string
}

export interface GodbConfig {
  version?: number
  schema?: GodbSchema
}

export interface GodbTableSchema {
  [key: string]: TableIndex | TableIndexTypes
}

export interface GodbSchema {
  [table: string]: GodbTableSchema
}

export interface GodbTableDict {
  [table: string]: GodbTableClass
}

// Test for types checking:
// const schema: GodbSchema = {
//   user: {
//     name: {
//       type: String,
//       unique: true,
//       someUnsupportedKey: '' // error detected by ts
//     },
//     a: Number,
//     b: Date,
//     c: Object,
//     d: Array,
//     e: Boolean,
//     f: Object,
//     g: Buffer // not supported yet
//   }
// };
