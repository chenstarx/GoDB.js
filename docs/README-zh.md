# 前言

2021 年，如果你的前端应用，需要在浏览器上保存数据，有三个主流方案可以选择：

- `Cookie`：上古时代就已存在，但能应用的业务场景非常有限
- `LocalStorage`：使用简单灵活，但是容量只有 10Mb，且不适合储存结构化数据
- `IndexedDB`：算得上真正意义上的数据库，功能强大，但坑异常多，使用麻烦，古老的 API 设计放在现代前端工程中总有种格格不入的感觉

我在大三的时候，曾经用 `IndexedDB` 写过一个背单词 App，当时就有把 `IndexedDB` 封装一遍的想法，但是由于学业紧张，后来就搁置了

最近，我终于有了空闲时间，于是捡起了当年的想法，开始尝试用 `TypeScript` 把 `IndexedDB` 封装一遍，把坑一个个填上，做成一个开发者友好的库，并开源出来，上传至 npm

拍脑袋后，我决定把这个项目命名为 `GoDB.js`


# GoDB.js

`GoDB.js` 的出现，**让你即使你不了解浏览器数据库 IndexedDB，也能把它用的行云流水，从而把关注点放到业务上面去**



毕竟要用好 IndexedDB，你需要翻无数遍 MDN，而 `GoDB` 替你吃透了 MDN，从而让你把 IndexedDB 用的更好的同时，操作还更简单了



当前项目处于 Beta 阶段（版本 0.6.x），意味着之后随时可能会有 breaking changes，在正式版（1.0.0 及以后）发布之前，不要把这个项目用到任何严肃的场景下


项目GitHub：
https://github.com/chenstarx/GoDB.js

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
import GoDB from 'godb';

const testDB = new GoDB('testDB');
const user = testDB.table('user');

const data = {
  name: 'luke',
  age: 22
};

user.add(data) // 增
  .then(luke => user.get(luke.id)) // 查，等价于 user.get({ id: luke.id })
  .then(luke => user.put({ ...luke, age: 23 })) // 改
  .then(luke => user.delete(luke.id)); // 删
```

- `Table.get()`，`Table.add()` 和 `Table.put()` 都返回完整数据
- `Table.delete()` 不返回数据（返回 `undefined`）



需要注意的就是，`put(obj)` 方法中的 `obj` 需要包含 `id`，否则就等价于 `add(obj)`

上面的 demo 中，`get()` 得到的 `luke` 对象包含 `id`，因此是修改操作

之后会引入一个 `update` 方法来改进这个问题



也可以一次性**添加多条数据**：

```javascript
const data = [
    { name: 'luke', age: 22 },
    { name: 'elaine', age: 23 }
];

user.addMany(data)
  .then(() => user.consoleTable());
```

**Table.consoleTable()**

这里用了一个 `Table.consoleTable()` 的方法，它会在浏览器的控制台打印出下面的内容：

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/95ad4418caf344bbb3fb7abd3eb21165~tplv-k3u1fbpfcp-zoom-1.image" alt="image-20210116212924230" style="zoom:50%;" />

这里的 (index) 就是 `id`



虽然 chrome 开发者工具内就能看到表内所有数据，但这个方法好处是可以在需要的时候打印出数据，方便 debug

注意：这个方法是异步的，因为需要在数据库里把数据库取出来；异步意味着紧接在它后面的代码，可能会在打印出结果之前执行，如果不希望出现这种情况，使用 `await` 或 `Promise.then` 即可


`addMany(data)` 方法：

- 严格按照 `data` 的顺序添加
- 返回 id 的数组，与 `data` 顺序一致

之所以单独写个 `addMany`，而不在 `add` 里加一个判断数组的逻辑，是因为用户想要的，可能就是添加一个数组到数据库中


注意：`addMany` 和 `add` 不要同步调用，如果在 `addMany` 正在执行时调用 `add`，可能会导致数据库里的顺序不符合预期，请在 `addMany` 的回调完成后再调用 `add`（未来可能会引入一个队列来修复这个问题）



**Table.find()**

如果你想在数据库中查找数据，还可以使用 `Table.find()` 方法：

```javascript
const data = [
    { name: 'luke', age: 22 },
    { name: 'elaine', age: 23 }
];

user.addMany(data)
  .then(() => {
    user.find((item) => {
    	return item.age > 22;
    })
      .then((data) => console.log(data))
      // { name: 'elaine', age: 23 }
  });
```

`Table.find(fn)` 接受一个函数 `fn` 作为参数，这个函数的返回值应当为 `true` 和 `false`

用法其实和 JS 数组方法 `Array.find()` 如出一辙

这个方法在内部会从头遍历整个表（使用 IndexedDB 的 Cursor），然后把每一次的结果放进 `fn` 执行，如果 `fn` 的返回值为 `true`（内部使用 `if(fn())` 判断），就返回当前的结果，停止遍历

这个方法只会返回第一个满足条件的值，如果需要返回所有满足条件的值，请使用 `Table.findAll()`，用法与 `Table.find()` 一致，但是会返回一个数组，包含所有满足条件的值


# Schema

如果你希望数据库的结构更严格一点，也可以添加 `schema`

`GoDB` 会根据 `schema` 建立 `IndexedDB` 数据库索引，给字段添加特性

```javascript
import GoDB from 'godb';

// 定义数据库结构
const schema = {
    // user 表：
    user: {
        // user 表的字段：
        name: {
            type: String,
            unique: true // 指定 name 字段在表里唯一
        },
        age: Number
    }
}

const testDB = new GoDB('testDB', schema);
const user = testDB.table('user');

const data = {
    name: 'luke'
    age: 22
};

user.add(data) // 没问题
  .then(() => user.get({ name: 'luke' })) // 定义schema后，就可以用id以外的字段获取数据
  .then(luke => user.add(luke)) // 报错，name 重复了
```



如上面的例子，指定了 `schema` 后
- 定义了 schema，因此 `get()` 和 `delete()` 中可以使用 `id` 以外的字段搜索了，否则只能传入 `id`
- 指定了 `user.name` 这一项是唯一的，因此无法添加重复的 `name`

当然，你也可以在 `table` 那定义 `schema`：

```javascript
const testDB = new GoDB('testDB');
const user = testDB.table('user', {
    name: {
        type: String,
        unique: true
    },
    age: Number
});
```

但这种方式的缺点是，如果定义 `table` 发生在连接数据库之后，`GoDB` 会先发起一个 `IDBVersionChange` 的事件，导致 `IndexedDB` 数据库版本升级，此时如果有别的 CRUD 操作正在进行，可能会导致建立 `table` 失败

要避免这个问题倒是很简单，把所有获取 `table` 的操作紧接在 `new GoDB()` 之后（保证这两操作是同步而非异步执行的）就可以，这样可以确保所有 `table` 都在连接完成之前获取到（JS 的事件循环特性）



**Table.get() 与 Table.find() 区别**

`get()` 使用数据库索引搜索，性能更高，但是需要定义 `schema`，才能使用 `id` 以外的索引进行搜索

而 `find()` 利用函数判断遍历全表，使用上更灵活，但是性能相对没有 `get()` 好


**关于 schema：**

部分同学或许会发现，上面定义 `schema` 的方式有点眼熟，没错，正是参考了 `mongoose`

- 定义数据库的字段时，可以只指明数据类型，如上面的 `age: Number`
- 也可以使用一个对象，里面除了定义数据类型 `type`，也指明这个字段是不是唯一的（`unique: true`），之后会添加更多可选属性，如用来指定字段默认值的 `default`，和指向别的表的索引 `ref`



不定义 Schema 时，`GoDB` 使用起来就像 MongoDB 一样，可以灵活添加数据；区别是 Mongodb 中，每条数据的唯一标识符是 `_id`，而 `GoDB` 是 `id`



虽然这样做的问题是，IndexedDB 毕竟还是结构化的，用户使用不规范的话（如每次添加的数据结构都不一样），久而久之可能会使得数据库的字段特别多，且不同数据中没用到的字段都是空的，导致浪费，影响性能



定义 Schema 后，`GoDB` 使用起来就像 MySQL 一样，如果添加 Schema 没有的字段，或者是字段类型不符合定义，会报错（在写文档的时候还没有实现这个功能，即使 Schema 不符合也能加，下个版本会安排上）



因此推荐在项目中，首先定义好 `schema`，这样不管是维护性上，还是性能上，都要更胜一筹



# 使用 await

由于 `GoDB` 的 API 都是 `Promise` 的，因此在很多场景下可以使用 `await`，使代码更简洁，同时拓宽使用场景（`await` 可以很方便用在循环内，而 `Promise.then` 很难）


```javascript
import GoDB from 'godb';

const db = new GoDB('testDB', schema);
const user = db.table('user', {
    name: {
      type: String,
      unique: true
    },
    age: Number
});

crud();

async function crud() {
  // 增:
  await user.addMany([
    { name: 'luke', age: 22 },
    { name: 'elaine', age: 23 }
  ]);

  console.log('add user: luke');
  await user.consoleTable(); // await 非必须，这里为了防止打印顺序出错

  // 查:
  const luke = await user.get({ name: 'luke' });

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

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8ba527bae8054731a119fb0124f17eb7~tplv-k3u1fbpfcp-zoom-1.image" alt="crud-test" style="zoom: 40%;" />



# API 设计

因为「连接数据库」和「连接表」这两个操作是异步的，在设计之初，曾经有两个 API 方案，区别在于：要不要把这两个操作，做为异步 API 提供给用户



这里讨论的不是「API 如何命名」这样的细节，而是「API 的使用方式」，因为这会直接影响到用户使用 `GoDB` 时的业务代码编写方式



以连接数据库 -> 添加一条数据的过程为例



**设计一：提供异步特性**

GitHub 上大多数开源的 IndexedDB 封装库都是这么做的

```javascript
import GoDB from 'godb';

// 连接数据库是异步的
GoDB.open('testDB')
    .then(testDB => testDB.table('user')) // 连接表也需要异步
    .then(user => {
        user.add({
            name: 'luke',
            age: 22
        });
    });
});
```



这样的优点是，工作流程一目了然，毕竟对数据库的操作，要放在连接数据库之后

**但是**，这种设计不适合工程化的前端项目！



因为，所有增删改查等操作，都需要用户，手动放到连接完成的异步回调之后，否则无法知道操作时有没有连上数据库和表

导致每次需要操作数据库时，都要先打开数据库一遍数据库，才能继续



即使你预先定义一个全局的连接，你在之后想要使用它时，如果不包一层 Promise，是无法确定数据库和表，在使用时有没有连接上的



以 Vue 为例，如果你在全局环境（比如 Vuex）定义了一个连接：

```javascript
import GoDB from 'godb';

new Vuex.Store({
  state: {
    godb: await GoDB.open('testDB') // 不加 await 返回的就是 Promise 了
  }
});
```



这样，在 Vue 的任何一个组件中，我们都能访问到 `GoDB` 实例

问题来了，在你的组件中，如果你想在组件初始化时，比如 `created` 和 `mounted` 这样的钩子函数中（React 中就是 `ComponentDidMount`），去访问数据库：

```javascript
new Vue({
   mounted() {
       const godb = this.$store.state.godb; // 从全局环境取出连接
       godb.table('user')
           .then(user => {
               user.add({
                   name: 'luke',
                   age: 22
               }); // user is undefined!
           });
   }
});
```

你会发现，如果这个组件在 App 初始化时就被加载，在组件 `mounted` 函数触发时，本地数据库可能根本就没有连接上！（连接数据库这样的操作，最典型的执行场景就是在组件加载时）



解决办法是，在每一个需要操作数据库的地方，都定义一个连接：

```javascript
import GoDB from 'godb';

new Vue({
    mounted() {
        GoDB.open('testDB')
          .then(testDB => testDB.table('user'))
          .then(user => {
              user.add({
                  name: 'luke',
                  age: 22
              });
          });
    }
});
```



这样不仅代码又臭又长，性能低下（每次操作都需要先连接），在需要连接本地数据库的组件多了后，维护起来更是一场噩梦



简而言之，就是这个方案，在工程化前端的不同组件中，需要在每次操作之前，都连一遍数据库，否则无法确保组件加载时，已经连接上了 IndexedDB



**设计二：隐藏连接的异步特性**

我最终采用了这个方案，对开发者而言，甚至感觉不到「连接数据库」和「连接表」这两个操作是异步的

```javascript
const testDB = new GoDB('testDB');
const user = testDB.table('user');

user.add({
    name: 'luke',
    age: 22
})
  .then(luke => console.log(luke));
```

这样使用上非常自然，开发者并不需要关心操作时有没有连上数据库和表，只需要在操作后的回调内写好自己的逻辑就可以



但是，这个方案的缺点就是开发起来比较麻烦（嘿嘿，麻烦自己，方便用户）

因为 `new Codb('testDB')` 内部的连接数据库的操作，实际上是异步的（因为 IndexedDB 的原生 API 就是异步的设计）

在连接数据库的操作发出去后，即使还没连接上，下面的 `testDB.table('user')` 和 `user.add()` 也会先开始执行

也就是说，之后的「获取 user 表」 和 「添加一条数据」实际上会先于「连上数据库」这个过程执行，如果实现该 API 设计时未处理这个问题，上面的示例代码肯定会报错



而要处理这个问题，我用到了下面两个方法：

- 在每次需要连上数据库的操作中（比如 `add()`），先拿到数据库的连接，再进行操作
- 使用队列 Queue，在还未连接时，把需要连接数据库的操作放进队列，等连接完成，再执行该队列



具体而言，就是

- 在 `GoDB` 的 class 中定义一个 `getDB(callback)`，用来获取 IndexedDB 连接实例
- 增删改查中，都调用 `getDB`，在 `callback` 获取到 IndexedDB 的连接实例后再进行操作
- `getDB` 中使用一个队列，如果数据库还没连接上，就把 `callback` 放进队列，在连接上后，执行这个队列中的函数
- 连接完成时，直接把 IndexedDB 连接实例传进 `callback` 执行即可



在调用 `getDB` 时，可能有三种状态（其实还有个数据库已关闭的状态，这里不讨论）：

1. 刚初始化，未发起和 IndexedDB 的连接
2. 正在连接 IndexedDB，但还未连上
3. 已经连上，此时已经有 IndexedDB 的连接实例



第一种状态只在第一次执行 `getDB` 时触发，因为一旦尝试建立连接就进入下一个状态了；第一次执行被我放到了 `GoDB` 类的构造函数中

第三种状态时，也就是已经连上数据库后，直接把连接实例传进 `callback` 执行即可



关键是处理第二种状态，此时正在连接数据库，但还未连上，无法进行增删改查：

```javascript
const testDB = new GoDB('testDB');
const user = testDB.table('user');

user.add({ name: 'luke' }); // 此时数据库正在连接，还未连上
user.add({ name: 'elaine' }); // 此时数据库正在连接，还未连上

testDB.onOpened = () => { // 数据库连接成功的回调
    user.add({ name: 'lucas' }); // 此时已连接
}
```

上面的例子，头两个 `add` 执行时其实数据库并未连接上

那要如何操作，才能保证正常添加，并且 `luke` 和 `elaine` 在 `lucas` 进入数据库的顺序，和代码顺序一致呢？



答案是使用队列 Queue，把数据库还未连上时的 `add` 操作加进队列，在连接成功时，按先进先出的顺序执行

这样，用户就不需要关心，操作时数据库是否已经连上了（只需要关注异步回调即可），`GoDB` 帮你在幕后做好了这一切



注意之所以使用 `callback` 而不是 `Promise`，是因为 JS 中的回调既可以是异步的，也可以是同步的

而连接成功，已经有连接实例后，直接同步返回连接实例更好，没必要再使用异步



还是以 Vue 为例，如果我们在 Vuex（全局变量）中添加连接实例：

```javascript
import GoDB from 'godb';

new Vuex.Store({
    state: {
        godb: new GoDB('testDB')
    }
});
```



这样，在所有组件中，我们都可以使用同一个连接实例：

```javascript
new Vue({
    computed: {
        // 把全局实例变为组件属性
        godb() {
            return this.$store.state.godb;
        }
    },
    mounted() {
        this.godb.table('user').add({
            name: 'luke',
            age: 22
        })
          .then(luke => console.log(luke));
    }
});
```



总结这个方案的优点：

- 性能更高（可以全局共享一个连接实例）
- 代码更简洁
- 最关键的，心智负担低了很多 -- 直接操作即可，无需关注数据库的连接状态



缺点：对 `GoDB.js` 的开发更麻烦，不是简单把 IndexedDB 封装一层 Promise 就行



因此，我最终采用了这个方案，毕竟麻烦我一个，方便你我他，优点远远盖过了缺点


如果对实现好奇的话，可以去阅读源码，当前只是实现了基本的 CRUD，源码暂时还不复杂



# 近期待办

在把基本的 CRUD 完成后，我就写下了这篇文章，让大家来尝尝鲜

而接下来要做的事其实非常多，近期我会完成下面的开发：

- [ ] `Table.update()`：更好的更新数据的方案
- [ ] 全局错误处理，目前代码里 throw 的 Error 其实是没被处理的
- [ ] 如果定义了 Schema，那就在所有 Table 的方法执行前都检查 Schema
- [ ] 如果定义了 Schema，保证数据库的结构和 Schema 一致
- [ ] 完善单元测试
- [ ] 把项目官网和完整文档上线



如果你有任何建议或意见，请在评论区留言，我会认证读每一个反馈

如果觉得这个项目有意思，欢迎给文章点赞，欢迎来 GitHub 点个 star~

https://github.com/chenstarx/GoDB.js


