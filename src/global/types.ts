import GodbClass from '../godb';
import GodbTableClass from '../table';

type PrimitiveType = number | string | boolean | null;
type DataType = PrimitiveType | object;

export type Godb = GodbClass;

export type GodbTable = GodbTableClass;

export interface GodbData {
  id: number,
  [key: string]: DataType | Array<DataType>
}

export interface GodbInputData {
  [key: string]: DataType | Array<DataType>
}

// some problems here
export interface GodbTableSearch {
  [key: string]: number | string
}

export type GetDBCallback = (idb: IDBDatabase) => void;

export type TableFindFunction = (item?: GodbData) => boolean;

export type TableKeyTypes =
  NumberConstructor
  | StringConstructor
  | BooleanConstructor
  | DateConstructor
  | ObjectConstructor
  | ArrayConstructor;

export interface TableKey {
  type: TableKeyTypes
  unique?: boolean
  default?: any
  ref?: string
}

export interface GodbConfig {
  version?: number
  schema?: GodbSchema
}

export interface GodbTableSchema {
  [key: string]: TableKey | TableKeyTypes
}

export interface GodbSchema {
  [table: string]: GodbTableSchema
}

export interface GodbTableDict {
  [table: string]: GodbTableClass;
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
