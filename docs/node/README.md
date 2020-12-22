# nodejs
## require加载原则
```
优先加载内置模块，即使有同名文件，也会优先使用内置模块。
不是内置模块，先去缓存找。
缓存没有就去找对应路径的文件。
不存在对应的文件，就将这个路径作为文件夹加载。
对应的文件和文件夹都找不到就去node_modules下面找。
还找不到就报错了。
从 Y 路径的模块 require(X) 
1. 如果 X 是一个核心模块，    
    a. 返回核心模块 //核心模块是指node.js下lib的内容    
    b. 结束 
2. 如果 X 是以 './' 或 '/' 或 '../' 开头    
    a. 加载文件(Y + X)    
    b. 加载目录(Y + X) 
3. 加载Node模块(X, dirname(Y)) // 导入一个NODE_MODULE，返回 
4. 抛出 "未找到" // 上述都没找到，直接排出没找到的异常。 

加载文件(X) 
1. 如果 X 是一个文件，加载 X 作为 JavaScript 文本。结束 
2. 如果 X.js 是一个文件，加载 X.js 作为 JavaScript 文本。结束 
3. 如果 X.json 是一个文件，解析 X.json 成一个 JavaScript 对象。结束 
4. 如果 X.node 是一个文件，加载 X.node 作为二进制插件。结束 

加载目录(X) 
1. 如果 X/package.json 是一个文件，    
    a. 解析 X/package.json，查找 "main" 字段    
    b. let M = X + (json main 字段)    
    c. 加载文件(M) 
2. 如果 X/index.js 是一个文件，加载  X/index.js 作为 JavaScript 文本。结束 
3. 如果 X/index.json 是一个文件，解析 X/index.json 成一个 JavaScript 对象。结束 
4. 如果 X/index.node 是一个文件，加载  X/index.node 作为二进制插件。结束 

加载Node模块(X, START) 
1. let DIRS=NODE_MODULES_PATHS(START) //得到 node_module 文件目录 
2. for each DIR in DIRS: // 遍历所有的路径 直到找到 x ，x 可能是 文件或者是目录    
    a. 加载文件(DIR/X)    
    b. 加载目录(DIR/X) 

NODE_MODULES_PATHS(START) //具体NODE_MODULES文件目录算法 
1. let PARTS = path split(START) 
2. let I = count of PARTS - 1 
3. let DIRS = [] 
4. while I >= 0,    
    a. if PARTS[I] = "node_modules" CONTINUE    
    b. DIR = path join(PARTS[0 .. I] + "node_modules")    
    c. DIRS = DIRS + DIR    
    d. let I = I - 1 5. return DIRS
```
###手写require
```js
const path = require('path');
const vm = require('vm');
const fs = require('fs');

function MyModule(id = '') {
  this.id = id;       // 这个id其实就是我们require的路径
  this.path = path.dirname(id);     // path是Node.js内置模块，用它来获取传入参数对应的文件夹路径
  this.exports = {};        // 导出的东西放这里，初始化为空对象
  this.filename = null;     // 模块对应的文件名
  this.loaded = false;      // loaded用来标识当前模块是否已经加载
}

MyModule.prototype.require = function (id) {
  return MyModule._load(id);
}

MyModule._cache = Object.create(null);
MyModule._extensions = Object.create(null);

MyModule._load = function (request) {    // request是我们传入的路劲参数
  const filename = MyModule._resolveFilename(request);

  // 先检查缓存，如果缓存存在且已经加载，直接返回缓存
  const cachedModule = MyModule._cache[filename];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }

  // 如果缓存不存在，我们就加载这个模块
  // 加载前先new一个MyModule实例，然后调用实例方法load来加载
  // 加载完成直接返回module.exports
  const module = new MyModule(filename);

  // load之前就将这个模块缓存下来，这样如果有循环引用就会拿到这个缓存，但是这个缓存里面的exports可能还没有或者不完整
  MyModule._cache[filename] = module;

  module.load(filename);

  return module.exports;
}

MyModule._resolveFilename = function (request) {
  const filename = path.resolve(request);   // 获取传入参数对应的绝对路径
  const extname = path.extname(request);    // 获取文件后缀名

  // 如果没有文件后缀名，尝试添加.js和.json
  if (!extname) {
    const exts = Object.keys(MyModule._extensions);
    for (let i = 0; i < exts.length; i++) {
      const currentPath = `${filename}${exts[i]}`;

      // 如果拼接后的文件存在，返回拼接的路径
      if (fs.existsSync(currentPath)) {
        return currentPath;
      }
    }
  }

  return filename;
}

MyModule.prototype.load = function (filename) {
  // 获取文件后缀名
  const extname = path.extname(filename);

  // 调用后缀名对应的处理函数来处理
  MyModule._extensions[extname](this, filename);

  this.loaded = true;
}

MyModule._extensions['.js'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  module._compile(content, filename);
}

MyModule.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];

MyModule.wrap = function (script) {
  return MyModule.wrapper[0] + script + MyModule.wrapper[1];
};

MyModule.prototype._compile = function (content, filename) {
  const wrapper = MyModule.wrap(content);    // 获取包装后函数体

  // vm是nodejs的虚拟机模块，runInThisContext方法可以接受一个字符串并将它转化为一个函数
  // 返回值就是转化后的函数，所以compiledWrapper是一个函数
  const compiledWrapper = vm.runInThisContext(wrapper, {
    filename,
    lineOffset: 0,
    displayErrors: true,
  });

  // 准备exports, require, module, __filename, __dirname这几个参数
  // exports可以直接用module.exports，即this.exports
  // require官方源码中还包装了一层，其实我们这里可以直接使用this.require
  // module不用说，就是this了
  // __filename直接用传进来的filename参数了
  // __dirname需要通过filename获取下
  const dirname = path.dirname(filename);

  compiledWrapper.call(this.exports, this.exports, this.require, this,
    filename, dirname);
}

MyModule._extensions['.json'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  module.exports = JSONParse(content);
}
```
另外一个版本
```js
let fs = require('fs')
let vm = require('vm')
let path = require('path')
function Module(id) {
  this.id = id
  this.exports = {}
}
Module.wrapper = [
  '(function (exports, require, module, __filename, __dirname) {',
  '})'
]
Module.wrap = function(script) {
  return Module.wrapper[0] + script + Module.wrapper[1]
}
Module._extensions = {
  '.js': function(module) {
    let content = fs.readFileSync(module.id, 'utf8')
    let funcStr = Module.wrap(content)
    let fn = vm.runInThisContext(funcStr)
    fn.call(module.exports, module.exports, req, module) // exports = {}
  },
  '.json': function(module) {
    module.exports = JSON.parse(fs.readFileSync(module.id, 'utf8'))
  }
}
// 解析文件名
Module._resolveFilename = function(p) {
  if (/\.js$|\.json$/.test(p)) {
    // 以js或者json结尾的
    return path.resolve(__dirname, p)
  } else {
    // 没有后后缀  自动拼后缀
    let exts = Object.keys(Module._extensions)
    let realPath
    for (let i = 0; i < exts.length; i++) {
      let temp = path.resolve(__dirname, p + exts[i])
      try {
        fs.accessSync(temp) // 存在的
        realPath = temp
        break
      } catch (e) {}
    }
    if (!realPath) {
      throw new Error('module not exists')
    }
    return realPath
  }
}
Module._cache = {}
function tryModuleLoad(module) {
  let ext = path.extname(module.id) //扩展名
  // 如果扩展名是js 调用js处理器 如果是json 调用json处理器
  Module._extensions[ext](module) // exports 上就有了数组
}
Module._load = function(p) {
  // 相对路径,可能这个文件没有后缀，尝试加后缀
  let filename = Module._resolveFilename(p) // 获取到绝对路径
  let cache = Module._cache[filename]
  if (cache) {
    // 第一次没有缓存 不会进来
    return cache.exports
  }
  let module = new Module(filename) // 没有模块就创建模块
  Module._cache[filename] = module // 每个模块都有exports对象 {}

  //尝试加载模块
  tryModuleLoad(module)
  return module.exports
}
function req(p) {
  return Module._load(p) // 加载模块
}

let str1 = req('./str.js')
// str2 = req('./str.js') //

```