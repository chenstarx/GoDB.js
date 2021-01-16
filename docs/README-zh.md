# Godb.js

原生 IndexedDB 用起来非常麻烦，而 `Godb.js` 的出现，**让你即使你不了解 IndexedDB，也能把它用的行云流水，从而把关注点放到业务上面去**


毕竟要用好 IndexedDB，你需要翻无数遍 MDN，而 `Godb` 替你吃透了 MDN，从而在把 IndexedDB 用的更好的同时，操作还更简单了



当前项目处于 Alpha 阶段（版本 0.3.x），意味着之后随时可能会有 breaking changes，在正式版（1.0.0 及以后）发布之前，不建议你把这个项目用到任何严肃的场景中



如果觉得不错的话就点个 Star 吧~



项目完整文档与官网正在紧张开发中，现阶段可以通过下面的 demo 来尝鲜



# 安装

首先需要安装，这里默认你使用了 webpack、gulp 等打包工具，或在 vue、react 等项目中

```
npm install godb
```

在第一个正式版发布后，还会提供 CDN 的引入方式，敬请期待~



# 简单上手

操作非常简单，**增、删、改、查各只需要一行代码：**

```javascript
import Godb from 'godb';

const testDB = new Godb('testDB');
const user = testDB.table('user');

const data = {
    name: 'luke'
    age: 22
};

user.add(data) // 增
  .then(id => user.get(id)) // 查，也可以是 user.get({ name: 'luke' })
  .then(luke => user.put({ ...luke, age: 23 })) // 改
  .then(id => user.delete(id)); // 删
```



这里注意增删改查四个方法在 `Promise.then` 的返回值：

- `get` 返回的是完整数据
- `add` 和 `put` 返回的是数据 id（也可以返回完整数据，评论区留言提意见吧~）
- `delete` 不返回数据（返回 `undefined`）



第二点需要注意的就是，`put(obj)` 方法中的 `obj` 需要包含 `id`，否则就等价于 `add(obj)`，上面的 demo 是因为 `get` 得到的 `luke` 中有 `id`，因此是修改操作

之后会引入一个 `update` 方法来改进这个问题



也可以一次性**添加多条数据**：

```javascript
const data = [
    {
        name: 'luke',
        age: 22
    },
    {
        name: 'elaine',
        age: 23
    }
];

user.addMany(data).then(() => user.consoleTable());
```



`addMany(data)` 方法：

- 严格按照 `data` 的顺序添加
- 返回 id 的数组，与 `data` 顺序一致

之所以单独写个 `addMany`，而不在 `add` 里加一个判断数组的逻辑，是因为用户想要的可能就是添加一个数组到数据库



注意：`addMany` 和 `add` 不要同步调用，如果在 `addMany` 正在执行时调用 `add`，会导致数据库里的顺序不符合预期，请在 `addMany` 的回调完成后再调用 `add`

请在 `await addMany()` 后再调用 `add()`，如果不加 `await`，`add` 的数据在表中，将会出现在 `addMany` 的第一条数据之后，第二条数据之前

在之后的版本中，我会想办法改进这个操作体验，比如等 `addMany` 完成后再继续 `add`



这里有一个 `Table.consoleTable()` 的方法，它会在浏览器的控制台打印出下面的内容：

<img src="https://cdn.lukerr.com/docs/godb/add-many.png" alt="add-many" style="zoom:50%;" />

(index) 就是 id



虽然 chrome 开发者工具内就能看到表内所有数据，但这个方法好处是可以在需要的地方打印出数据，方便 debug

注意：这个方法是异步的，因为需要在数据库里把数据库取出来；异步意味着紧接在它后面的代码，可能会在打印出结果之前执行，如果不希望出现这种情况，使用 `await` 或 `Promise.then` 即可



# Schema

如果你希望数据库的结构更严格一点，也可以添加 `schema`

```javascript
import Godb from 'godb';

// 定义数据库结构
const schema = {
    // user 表：
    user: {
        // user 表的字段：
        name: {
            type: String,
            unique: true // 字段在表里唯一
        },
        age: Number
    }
}

const testDB = new Godb('testDB');
const user = testDB.table('user');

const luke1 = {
    name: 'luke'
    age: 22
};

const luke2 = {
    name: 'luke'
    age: 19
};

user.add(luke1) // 没问题
  .then(() => user.add(luke2)) // 报错
```



如上面的例子，指定了 `user.name` 这一项是唯一的，因此无法添加重复的 `name`



**关于 schema：**

部分同学或许会发现，上面定义 `schema` 的方式有点眼熟，没错，正是参考了 `mongoose`

- 定义数据库的字段时，可以只指明数据类型，如上面的 `age: Number`
- 也可以使用一个对象，里面除了定义数据类型 `type`，也指明这个字段是不是唯一的（`unique: true`），之后会添加更多可选属性，如用来指定字段默认值的 `default`，和指向别的表的索引 `ref`



不定义 Schema 时，`Godb` 使用起来就像 MongoDB 一样，可以灵活添加数据；区别是 Mongodb 中，每条数据的唯一标识符是 `_id`，而 `Godb` 是 `id`



虽然这样做的问题是，IndexedDB 毕竟还是结构化的，用户使用不规范的话（如每次添加的数据结构都不一样），久而久之可能会使得数据库的字段特别多，且不同数据中没用到的字段都是空的，导致浪费，影响性能



定义 Schema 后，`Godb` 使用起来就像 MySQL 一样，如果添加 Schema 没有的字段，或者是字段类型不符合定义，会报错（在写文档的时候还没有实现这个功能，即使 Schema 不符合也能加，下个版本会安排上）



因此推荐在项目中，定义好 `schema`，这样不管是维护性上，还是性能上，都要更胜一筹



**另一个使用 await 的 CRUD demo：**

```javascript
import Godb from 'godb';

const schema = {
  user: {
    name: {
      type: String,
      unique: true
    },
    age: Number
  }
};

const db = new Godb('testDB', schema);
const user = db.table('user');

crud();

async function crud() {

  // 增:
  await user.addMany([
    {
      name: 'luke',
      age: 22
    },
    {
      name: 'elaine',
      age: 23
    }
  ]);

  console.log('add user: luke');
  // await 非必须，这里是为了防止打印顺序不出错
  await user.consoleTable();

  // 查:
  const luke = await user.get({ name: 'luke' });
  // const luke = await user.get(2); // 等价于：
  // const luke = await user.get({ id: 2 });

  // 改:
  luke.age = 23;
  await user.put(luke);

  console.log('update: set luke.age to 23');
  await user.consoleTable();

  // 删:
  await user.delete({ name: 'luke' });

  console.log('delete user: luke');
  await user.consoleTable();

}

```



上面这段 demo，会在控制台打印出下面的内容：

<img src="https://cdn.lukerr.com/docs/godb/crud-test.png" alt="crud-test" style="zoom: 40%;" />


# 项目待办

在把基本的 CRUD 完成后，我就写下了这篇文章，让大家来尝尝鲜

而接下来要做的事其实非常多，近期我会完成下面的开发：

- [ ] `Table.find()`：查找函数
- [ ] `Table.update()`：更好的更新数据的方案
- [ ] 全局错误处理，目前代码里 throw 的 Error 其实是没被处理的
- [ ] 如果定义了 Schema，那就在所有 Table 的方法执行前都检查 Schema
- [ ] 如果定义了 Schema，保证数据库的结构和 Schema 一致



如果你有任何建议或意见，请在评论区留言，我会认证读每一个反馈

如果觉得这个项目有意思，欢迎点个 star~
