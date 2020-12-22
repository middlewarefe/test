# 每日分享
## 重置页面copy事件
每日tips
平日逛思否，掘金，简书等网站要复制文本的时候，可能会出现不让复制，或者复制内容后面跟着著作权归作者所有，等字样
原因是网站监听copy事件，改写了copy事件逻辑。
解决方案有
1.用IE打开复制，copy事件中的clipboardData属性 IE浏览器不兼容
2.控制台打开设置将JavaScript禁掉
3.写油猴脚本，匹配到该网站，替换到原先的copy监听事件

脚本如下
```js 
document.addEventListener('copy', function (event) {
    var clipboardData = event.clipboardData || window.clipboardData;
    if (!clipboardData) { return; }
    var text = window.getSelection().toString();
    if (text) {
        event.preventDefault();
        clipboardData.setData('text/plain', text);
    }
});
```
::: tip 提醒
男哥测试mac不生效
:::

## 面试 createFlow 

题目是
```js 
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let log=console.log
const subFlow = createFlow([() => delay(1000).then(() => log("c"))]);

createFlow([
    () => log("a"),
    () => log("b"),
    subFlow,
    [() => delay(1000).then(() => log("d")), () => log("e")],
]).run(() => {
    console.log("done");
});
```
实现打印a,b 过一秒c 再过一秒d 再打印done

#####方案1
``` js
function createFlow(effects) {
    return {
      async run(callback) {
        effects = effects.flat(Infinity);
        for (const effect of effects) {
          if (effect(effect.run) === 'Function') {
            await effect.run();
          } else {
            await effect();
          }
        }
        callback&&callback()
      }
    };
  }
```

## js 如果两个, 会取最后一个

``` js
console.log((1,2,3))// 3
console.log([1,2,3][1,2])=console.log([1,2,3][2])=3
```

## 表单label 自定义的话 
``` js
<el-form-item label-width="160px">
    <span slot="label">
      <el-tooltip
        class="item"
        effect="dark"
        content="批量升级需要验证新Chart，当实例升级后状态为升级成功时，验证状态为已验证"
        placement="top"
      >
        <i class="el-icon-question"></i> </el-tooltip
      >新Chart验证状态：</span
    >
    {{ verifyStatus('text') }}
</el-form-item>
```
如果不加 label-width="160px" 会被后面的定位元素覆盖
原因是 如果两个盒子 左面是浮动 右面是定位 浮动的层级不如定位的高被挡住了
z-index 只能在定位的时候生效 非static

## ES6 标签模板与模板字符串
``` js
var a = 5;
var b = 10;
tag`Hello ${a + b} world ${a * b}`;
//这个标识名tag,它是一个函数。整个表达式的返回值，就是tag函数处理模板字符串之后的返回值。函数tag会依次接收到多个参数。
function tag(a,b,c){
    console.log(a,b,c)//[ 'Hello ', ' world ', '' ] 15 50
}
``` 

##  ES6 - 链判断运算符
编程实务中，如果读取对象内部的某个属性，往往需要判断一下该对象是否存在。比如，要读取message.body.user.firstName，安全的写法是写成下面这样
``` js
const firstName = (message
  && message.body
  && message.body.user
  && message.body.user.firstName) || 'default';
```
或者使用三元运算符?:，判断一个对象是否存在。
``` js
const fooInput = myForm.querySelector('input[name=foo]')
const fooValue = fooInput ? fooInput.value : undefined
```
这样的层层判断非常麻烦，因此 ES2020 引入了“链判断运算符”（optional chaining operator）?.，简化上面的写法。
```
const firstName = message?.body?.user?.firstName || 'default';
const fooValue = myForm.querySelector('input[name=foo]')?.value
```
上面代码使用了?.运算符，直接在链式调用的时候判断，左侧的对象是否为null或undefined。如果是的，就不再往下运算，而是返回undefined。

链判断运算符有三种用法。
```
obj?.prop // 对象属性
obj?.[expr] // 同上
func?.(...args) // 函数或对象方法的调用
```

##  管道操作符
````
const double = (n) => n * 2;
const increment = (n) => n + 1;

// 没有用管道操作符
double(increment(double(5))); // 22

// 用上管道操作符之后
5 |> double |> increment |> double; // 22
````

## 简版MVVM v-model {{}}原理
``` js
class Observer {
  constructor(data) {
    // 如果不是对象，则返回
    if (!data || typeof data !== 'object') {
      return
    }
    this.data = data
    this.walk()
  }

  // 对传入的数据进行数据劫持
  walk() {
    for (let key in this.data) {
      this.defineReactive(this.data, key, this.data[key])
    }
  }
  // 创建当前属性的一个发布实例，使用Object.defineProperty来对当前属性进行数据劫持。
  defineReactive(obj, key, val) {
    // 创建当前属性的发布者
    const dep = new Dep()
    /*
     * 递归对子属性的值进行数据劫持，比如说对以下数据
     * let data = {
     *  name: 'cjg',
     *  obj: {
     *   name: 'zht',
     *   age: 22,
     *   obj: {
     *    name: 'cjg',
     *    age: 22,
     *   }
     *  },
     * };
     * 我们先对data最外层的name和obj进行数据劫持，之后再对obj对象的子属性obj.name,obj.age, obj.obj进行数据劫持，层层递归下去，直到所有的数据都完成了数据劫持工作。
     */
    new Observer(val)
    Object.defineProperty(obj, key, {
      get() {
        // 若当前有对该属性的依赖项，则将其加入到发布者的订阅者队列里
        if (Dep.target) {
          dep.addSub(Dep.target)
        }
        return val
      },
      set(newVal) {
        if (val === newVal) {
          return
        }
        val = newVal
        new Observer(newVal)
        dep.notify()
      }
    })
  }
}

// 发布者,将依赖该属性的watcher都加入subs数组，当该属性改变的时候，则调用所有依赖该属性的watcher的更新函数，触发更新。
class Dep {
  constructor() {
    this.subs = []
  }

  addSub(sub) {
    if (this.subs.indexOf(sub) < 0) {
      this.subs.push(sub)
    }
  }

  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

Dep.target = null

// 观察者
class Watcher {
  /**
   *Creates an instance of Watcher.
   * @param {*} vm
   * @param {*} keys
   * @param {*} updateCb
   * @memberof Watcher
   */
  constructor(vm, keys, updateCb) {
    this.vm = vm
    this.keys = keys
    this.updateCb = updateCb
    this.value = null
    this.get()
  }

  // 根据vm和keys获取到最新的观察值
  get() {
    // 将Dep的依赖项设置为当前的watcher,并且根据传入的keys遍历获取到最新值。
    // 在这个过程中，由于会调用observer对象属性的getter方法，因此在遍历过程中这些对象属性的发布者就将watcher添加到订阅者队列里。
    // 因此，当这一过程中的某一对象属性发生变化的时候，则会触发watcher的update方法
    Dep.target = this
    this.value = CompileUtils.parse(this.vm, this.keys)
    Dep.target = null
    return this.value
  }

  update() {
    const oldValue = this.value
    const newValue = this.get()
    if (oldValue !== newValue) {
      this.updateCb(oldValue, newValue)
    }
  }
}

class MVVM {
  constructor({ data, el }) {
    this.data = data
    this.el = el
    this.init()
    this.initDom()
  }

  // 初始化
  init() {
    // 对this.data进行数据劫持
    new Observer(this.data)
    // 传入的el可以是selector,也可以是元素，因此我们要在这里做一层处理，保证this.$el的值是一个元素节点
    this.$el = this.isElementNode(this.el)
      ? this.el
      : document.querySelector(this.el)
    // 将this.data的属性都绑定到this上，这样用户就可以直接通过this.xxx来访问this.data.xxx的值
    for (let key in this.data) {
      this.defineReactive(key)
    }
  }

  initDom() {
    const fragment = this.node2Fragment()
    this.compile(fragment)
    document.body.appendChild(fragment)
  }
  // 将节点转为fragment,通过fragment来操作DOM，可以获得更高的效率
  // 因为如果直接操作DOM节点的话，每次修改DOM都会导致DOM的回流或重绘，而将其放在fragment里，修改fragment不会导致DOM回流和重绘
  // 当在fragment一次性修改完后，在直接放回到DOM节点中
  node2Fragment() {
    const fragment = document.createDocumentFragment()
    let firstChild
    while ((firstChild = this.$el.firstChild)) {
      fragment.appendChild(firstChild)
    }
    return fragment
  }

  defineReactive(key) {
    Object.defineProperty(this, key, {
      get() {
        return this.data[key]
      },
      set(newVal) {
        this.data[key] = newVal
      }
    })
  }

  compile(node) {
    const textReg = /\{\{\s*\w+\s*\}\}/gi // 检测{{name}}语法
    if (this.isElementNode(node)) {
      // 若是元素节点，则遍历它的属性，编译其中的指令
      const attrs = node.attributes
      Array.prototype.forEach.call(attrs, attr => {
        if (this.isDirective(attr)) {
          CompileUtils.compileModelAttr(this.data, node, attr)
        }
      })
    } else if (this.isTextNode(node)) {
      // 若是文本节点，则判断是否有{{}}语法，如果有的话，则编译{{}}语法
      let textContent = node.textContent
      if (textReg.test(textContent)) {
        // 对于 "test{{test}} {{name}}"这种文本，可能在一个文本节点会出现多个匹配符，因此得对他们统一进行处理
        // 使用 textReg来对文本节点进行匹配，可以得到["{{test}}", "{{name}}"]两个匹配值
        const matchs = textContent.match(textReg)
        CompileUtils.compileTextNode(this.data, node, matchs)
      }
    }
    // 若节点有子节点的话，则对子节点进行编译。
    if (node.childNodes && node.childNodes.length > 0) {
      Array.prototype.forEach.call(node.childNodes, child => {
        this.compile(child)
      })
    }
  }

  // 是否是属性节点
  isElementNode(node) {
    return node.nodeType === 1
  }
  // 是否是文本节点
  isTextNode(node) {
    return node.nodeType === 3
  }

  isAttrs(node) {
    return node.nodeType === 2
  }
  // 检测属性是否是指令(vue的指令是v-开头)
  isDirective(attr) {
    return attr.nodeName.indexOf('v-') >= 0
  }
}

const CompileUtils = {
  reg: /\{\{\s*(\w+)\s*\}\}/, // 匹配 {{ key }}中的key
  // 编译文本节点，并注册Watcher函数，当文本节点依赖的属性发生变化的时候，更新文本节点
  compileTextNode(vm, node, matchs) {
    // 原始文本信息
    const rawTextContent = node.textContent
    matchs.forEach(match => {
      const keys = match.match(this.reg)[1]
      console.log(rawTextContent)
      new Watcher(vm, keys, () =>
        this.updateTextNode(vm, node, matchs, rawTextContent)
      )
    })
    this.updateTextNode(vm, node, matchs, rawTextContent)
  },
  // 更新文本节点信息
  updateTextNode(vm, node, matchs, rawTextContent) {
    let newTextContent = rawTextContent
    matchs.forEach(match => {
      const keys = match.match(this.reg)[1]
      const val = this.getModelValue(vm, keys)
      newTextContent = newTextContent.replace(match, val)
    })
    node.textContent = newTextContent
  },
  // 编译v-model属性,为元素节点注册input事件，在input事件触发的时候，更新vm对应的值。
  // 同时也注册一个Watcher函数，当所依赖的值发生变化的时候，更新节点的值
  compileModelAttr(vm, node, attr) {
    const { value: keys, nodeName } = attr
    node.value = this.getModelValue(vm, keys)
    // 将v-model属性值从元素节点上去掉
    node.removeAttribute(nodeName)
    new Watcher(vm, keys, (oldVal, newVal) => {
      node.value = newVal
    })
    node.addEventListener('input', e => {
      this.setModelValue(vm, keys, e.target.value)
    })
  },
  /* 解析keys，比如，用户可以传入
   * let data = {
   *  name: 'cjg',
   *  obj: {
   *   name: 'zht',
   *  },
   * };
   * new Watcher(data, 'obj.name', (oldValue, newValue) => {
   *  console.log(oldValue, newValue);
   * })
   * 这个时候，我们需要将keys解析为data[obj][name]的形式来获取目标值
   */
  parse(vm, keys) {
    keys = keys.split('.')
    let value = vm
    keys.forEach(_key => {
      value = value[_key]
    })
    return value
  },
  // 根据vm和keys，返回v-model对应属性的值
  getModelValue(vm, keys) {
    return this.parse(vm, keys)
  },
  // 修改v-model对应属性的值
  setModelValue(vm, keys, val) {
    keys = keys.split('.')
    let value = vm
    for (let i = 0; i < keys.length - 1; i++) {
      value = value[keys[i]]
    }
    value[keys[keys.length - 1]] = val
  }
}

```
## 共享进程 可以在各个标签通讯 
关键字SharedWorker
https://segmentfault.com/a/1190000019699502 demo地址
https://developer.mozilla.org/zh-CN/docs/Web/API/Channel_Messaging_API 这个兼容性好 也不错
案例:音乐 如果多个页面 当前页面播放 可以让其他页面暂停 

## css实现一个正方形
如果padding-bottom 值设置为百分比的时候，这个取的是父级的width

## 要求将一个数组离自己最近的大于自己的index之差输出，如果没有就是0
```` js
let arr = [73, 74, 75, 71, 69, 72, 76, 73]
function diff(arr) {
  let tempAry = []
  for (let i = 0; i < arr.length; i++) {
    let flag = 0
    if (i === arr.length - 1) {
      tempAry.push(0)
    }
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] > arr[i]) {
        flag = 0
        tempAry.push(j - i)
        break
      } else {
        flag = 1
      }
    }
    if (flag === 1) {
      tempAry.push(0)
    }
  }
  return tempAry
}
console.log(diff(arr))//[ 1, 1, 4, 2, 1, 1, 0, 0]
````
## 滑动窗口算法题
```` js
// 输入: nums = [1,3,-1,-3,5,3,6,7], 和 k = 3
// 输出: [3,3,5,5,6,7]
// 解释:
//
//   滑动窗口的位置                最大值
// ---------------               -----
//  [1  3  -1] -3  5  3  6  7       3
//  1 [3  -1  -3] 5  3  6  7       3
//  1  3 [-1  -3  5] 3  6  7       5
//  1  3  -1 [-3  5  3] 6  7       5
//  1  3  -1  -3 [5  3  6] 7       6
//  1  3  -1  -3  5 [3  6  7]      7

function slide(nums,k) {
  let res=[]
  for (let i=0;i<nums.length-k+1;i++ ){
    let max=nums[i]
    for (let j=i+1;j<i+k;j++){
      max=Math.max(max,nums[j])
    }
    res.push(max)
  }
  return res
}
function slide(nums,k){
  let list=[]
  let res=[]
  for (let i=0;i<nums.length;i++){
    if(i-list[0]>=k){
      list.shift();
    }
    while (nums[i]>=nums[list[list.length-1]]){
      list.pop()
    }
    list.push(i)
    if(i>=k-1){
      res.push(nums[list[0]])
    }
  }
  return res
}
console.log(slide(nums,k))
```` 
## 全排列算法题
```js
let nums = [1, 2, 3]

//输出 [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
function sort(nums) {
  let res = []
  function backTrack(list) {
    if (list.length === nums.length) res.push(list)
    for (let n of nums) {
      if (list.includes(n)) continue
      list.push(n)
      backTrack(list.slice(0))
      list.pop()
    }
  }
  backTrack([])
  return res
}
function backTrack(list, tem, nums) {
  if (nums.length === 0) {
    return list.push(tem.slice())
  }
  for (let i = 0; i < nums.length; i++) {
    let cur = nums.shift()
    backTrack(list, [...tem, cur], nums)
    nums.push(cur)
  }
}
function combine(nums) {
  let list = []
  backTrack(list, [], nums)
  return list
}
console.log(combine(nums))
//console.log(sort(nums))

```