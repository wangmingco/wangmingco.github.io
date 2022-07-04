---
category: 翻译
tag: PEG.js
title: PEG.js 文档 [译]
date: 2018-12-15 10:21:00
---

> [PEG.js 文档 [译]](https://zhuanlan.zhihu.com/p/123294460)

[PEG.js](https://pegjs.org/documentation) 是JavaScript里一个简单的parser生成器, 它能够非常快的生成parser, 而且如果在生成过程中遇到了问题, 也会给出非常明确的错误报告. 你可以很轻松地用它处理复杂的数据结构或者计算机语言, 也可以构建出transformers, interpreters, compilers 等其他工具.

## 特性
PEG.js具有如下特性
* 简单而富有表现力的语法
* 集成了词法和语法分析.
* 生成的解析器具有出色的错误报告功能
* 基于parsing expression grammar, 生成的parser 比传统的 LL(k) 和 LR(k) parser更加强大.
* 适用于浏览器, 命令行或者JavaScript API 等多种环境.

## 安装

### Node.js
在命令行中使用`pegjs`命令编译, 需要使用全局模式安装`PEG.js`:
```
$ npm install -g pegjs
```
如果要使用pegjs提供的 JavaScript API, 则需要在当前工作目录安装 `PEG.js`:
```
$ npm install pegjs
```
如果既要使用`pegjs`命令又要使用JavaScript API, 那么你需要将上面俩种方式都安装一遍.

### Browser
在浏览器中使用, 可以直接下载库文件[PEG.js](https://pegjs.org/#download)或者通过`Bower`安装`PEG.js`:
```
$ bower install pegjs
```

## 生成 Parser
`PEG.js`将解析表达式文法解析后, 生成parser. 解析表达式文法描述描述了 将何种输入进行解析然后输出何种输出.(通过执行输入字符的匹配部分的语义操作). 通过一个简单api就可以可以生成一个parser JS对象.

### 命令行生成
想要将grammar文件生成parser, 直接使用`pegjs`进行编译即可:
```
$ pegjs arithmetics.pegjs
```
上面的命令会将生成的parser的源码输出到与grammar文件同名的js结尾的文件中. 当然也可以输出到指定文件中:

```
$ pegjs -o arithmetics-parser.js arithmetics.pegjs
```

但是如果你将输入输出文件都忽略了, 那么系统将会采用标准输入输出.
在默认设置下, 生成的parser代码是以Node.js module format 进行组织代码的, 但也可以通过指定`--format`选项选择其他方式.

> 下面的选项介绍中也有对该选项的介绍, 详情请参考[[译]神马是AMD, CommonJS, UMD?](https://75team.com/post/%E8%AF%91%E7%A5%9E%E9%A9%AC%E6%98%AFamd-commonjs-umd.html)

你可以通过如下几个命令来修改生成的parser的默认行为.

* `--allowed-start-rules`: 指定parser开始从哪个rule开始解析. (默认是文法中的第一个rule)
* `--cache`: 开启parser的缓存功能. parser会将parse出来的结果缓存起来, 避免极端情况下解析时间成指数级增加, 但坏处是parser可能会变慢.
* `--dependency`: 让parser依赖一个指定的依赖.(该参数可以多次使用)
* `--export-var`: 
* `--extra-options`: 传递给`peg.generate`的额外参数(JSON 形式).
* `--extra-options-file`: 传递给`peg.generate`的额外参数文件(JSON 形式).
* `--format`: 生成的parser格式, 可选值有`amd`, `commonjs`, `globals`, `umd`(默认是`commonjs`)
* `--optimize`: 为生成的parser在parsing时的优化方式, 可以选择解析速度(`speed`)或者parse结果代码大小(`size`). (默认是`speed`)
* `--plugin`: 为PEG.js配置插件(可以配置多个, 即多次配置)
* `--trace`: 开启parser的trace功能.

### API生成
在node.js中, 直接`require("pegjs")` 就可以使用peg.js的parser生成器了.
```javascript
var peg = require("pegjs");
```
在浏览器中, 需要在`<script>`标签引入`PEG.js`库. 如果 PEG.js 检测到一个 AMD loader, 它会把自己定义成一个 module, 否则我们只能通过`peg`这个全局对象使用pegjs的api了.
生成一个parser非常简单, 把解析器文法参数传递进`peg.generate`方法就可以了:
```javascript
var parser = peg.generate("start = ('a' / 'b')+");
```

根据参数的不同, 这个方法可能会返回一个新生成的parser对象或者是一个包含parser源码的字符串. 如果文法参数不合法, 则会抛出一个异常(异常中会包含这个错误的详细信息). 

可以通过向`peg.generate`方法传递第二个参数(该参数是一个对象)改变生成的parser的默认行为. 支持的参数如下:
* `allowedStartRules`: 指定parser开始的rule. (默认是文法中第一个rule.)
* `cache`: 如果设置为`true`, parser会将parse的结果缓存起来, 可以避免在极端情况下过长的解析时间, 但同时它带来的副作用是会使得parser变慢(默认false).
* `dependencies`: 设置parser的依赖, 其值是一个对象, 其key为访问依赖的变量, 而value为需要加载的依赖module id.只有当`format`参数被设置为`"amd"`, `"commonjs"`, `"umd"` 该参数才生效. (默认为`{}`)
* `exportVar`: Name of a global variable into which the parser object is assigned to when no module loader is detected; valid only when format is set to "globals" or "umd" (default: null).
* `format`: 生成的parser格式, 可选值为(`"amd"`, `"bare"`, `"commonjs"`, `"globals"`, or `"umd"`). 只有`output`设置为`source`, 该参数才生效
* `optimize`: 为生成的parser选择一个优化方案, 可选值为`"speed"`或者`"size"`. (默认`"speed"`)
* `output`: 设置`generate()`方法返回格式. 如果值为`"parser"`, 则返回生成的parser对象. 如果设置为`"source"`, 则返回parser source字符串
* `plugins`: 要使用的插件
* `trace`: 追踪parser的执行过程(默认是false).

## 使用 Parser
使用生成的parser也非常简单, 只需要调用parser对象的`parse`方法, 然后将一个字符串参数传递进该方法就可以了. 然后该方法会返回一个parse结果(已经在定义parser的文法中描述了返回何种类型的值), 或者如果字符串不合法的话抛出一个异常. 异常会输出详细的错误信息.

```javascript
parser.parse("abba"); // returns ["a", "b", "b", "a"]

parser.parse("abcd"); // throws an exception 
```

同样的, `parse`方法也支持选项参数. 支持的参数如下:
* startRule: Name of the rule to start parsing from. 开始从哪个rule执行.
* tracer: Tracer to use. 开启tracer.

Parsers 也可以自定义参数, 以支持定制化的需求.

## 语法和语义
peg.js的语法和JavaScript非常像, 但是有俩点不同, pegjs不是line-oriented, 而且peg.js会忽略tokens之间的空白符. 同样地可以在peg.js中使用`//...`和`/* ... */`进行注释.
下面是个peg.js文法示例, 该示例生成的parser会识别出算数表达式 `2*(3+4)`, 然后将该值计算出来.

```javascript
start
  = additive

additive
  = left:multiplicative "+" right:additive { return left + right; }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return left * right; }
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return parseInt(digits.join(""), 10); }
```
总体来说, 文法是由rule组成的(例如上面的例子中有5个rule). 每个rule都有一个名字(例如上例中`integer`) 和 一个解析表达式(例如上例中:`digits:[0-9]+ { return parseInt(digits.join(""), 10); }`). 表达式部分首先是一个匹配输入字符串的匹配规则, 然后可能后面还会有一个匹配成功之后要执行的JavaScript代码. rule也可以设置一个更加易于理解的别名, 例如上例中的integer就有一个别名, 该别名主要用于发生解析异常时, 输出日志便于解决问题. 解析动作从第一个rule开始, 我们通常以`start`命名这个rule.

rule名称必须符合JavaScript的标识符规则. rule名称后跟一个`=`符号, 然后`=`后面是一个解析表达式. 如果rule名称要跟一个别名的话, 该别名必须在rule名称与`=`之间. rule之间需要由空白行进行分割, rule后也可以跟一个分号`;`

第一个规则之前可以设置一个初始化器, 初始化器由花括号("{"和"}")和花括号内的JavaScript代码组成. 初始化器会在parser开始解析之前被执行. 初始器里定义的变量和方法可以被后续的rule访问到. 初始器可以通过访问`options`参数访问到传递给parser的参数. 初始化器必须由大括号括起来, 缺一不可. 下面我们看一个简单的使用了初始化代码的示例:

```javascript
{
  function makeInteger(o) {
    return parseInt(o.join(""), 10);
  }
}

start
  = additive

additive
  = left:multiplicative "+" right:additive { return left + right; }
  / multiplicative

multiplicative
  = left:primary "*" right:multiplicative { return left * right; }
  / primary

primary
  = integer
  / "(" additive:additive ")" { return additive; }

integer "integer"
  = digits:[0-9]+ { return makeInteger(digits); }
```
peg.js会将输入的字符串与rule中定义的解析表文法进行匹配. 但是存在着很多不同类型的表达式, 例如匹配字符或者字符类型, 或者匹配可选部分, 或者匹配重复情况等等. 表达式可能还包含其他rule的引用.

当parser将输入字符串与表达式成功的时候, parser会生成一个JavaScript对象的匹配结果. 例如
* 表达式匹配到了一个字符串字面量的话, 它会返回一个包含该字符串的JavaScript字符串对象.
* 当表达式匹配到重复的子表达式的时候, 会将所有匹配结果放到一个JavaScript数组对象里返回.

如果rule A在表达式B被引用了, 那么这个rule A的匹配结果也会传递表达式B, 接着会层层传递, 一直传递到start rule里. 当parser全部解析完成成功之后, 会直接将start rule的匹配结果返回出去.

解析表达式中比较特殊的是parser action,一段包含在大括号内的JavaScript代码，这段代码可以处理表达式中引用的其他rule的匹配结果，然后自己再返回一个JavaScript对象作为当前表达式的处理结果。这个对象就是当前表达式的匹配结果，换句话说，parser action就是一个匹配结果转换器。

在我们的运算示例中，有许许多多的parser action. 看一下表达式中的这个action `digits:[0-9]+ { return parseInt(digits.join(""), 10); }`. 它拿到了`[0-9]+`的匹配结果`digits`(`digits` 是一个包含数字的字符串数组)。它将这些数字字符转换成一个数字，然后转换成一个js数字对象。

### 解析表达式类型
解析表达式可以分为很多种类, 而且有一些还包含子表达式, 包含子表达式的就形成了一种递归结构.

##### `"literal"` `'literal'`
严格匹配字面量字符串, 然后直接返回该字符串字面量. 在pegjs里字符串语法和JavaScript里相同. 在常量最后加一个`i`表示不区分大小写.

> 输入的字符串必须与该字符串一模一样(可以加`i`忽略大小写)

##### `.`
严格匹配任意单个字符, 然后将它作为一个字符串返回.

##### `[characters]`
单个字符匹配, 将匹配成功的单个字符作为字符串返回. The characters in the list can be escaped in exactly the same way as in JavaScript string. 匹配模式中的字符列表也可以指定一个范围(例如`[a-z]`表示要匹配全部小写字符). 如果匹配规则中有`^`表示匹配规则相反. (例如`[^a-z]` 表示匹配除了小写字符之外的全部字符). 如果匹配规则后面跟有`i`的话, 表示忽略大小写.

> `[characters]` 通常会和`*`, `+` 组合到一起使用, 匹配字符串. 与`'literal'` 不同的是, 只要单个字符符合`[characters]` 中任意一个字符即可.

##### `rule`
在表达式中引用其他rule, 然后与引用的rule进行匹配, 然后返回引用rule的匹配结果.

##### `( expression )`
匹配一个子表达式, 并返回它的匹配结果.

> 匹配不成功则会抛出异常

##### `expression *`
将表达式匹配0次或多次, 然后将匹配结果通过一个数组返回. 这种匹配形式会尽可能多地尝试匹配. 与正则表达式不同的是, 它们不会进行回溯.

> 匹配不成功则会抛出异常

##### `expression +`
将表达式匹配1次或多次, 然后将匹配结果通过一个数组返回. 这种匹配形式会尽可能多地尝试匹配. 与正则表达式不同的是, 它们不会进行回溯.

> 匹配不成功则会抛出异常

##### `expression ?`
尝试去匹配表达式. 如果匹配成功, 则返回匹配结果, 否则返回null. 与正则表达式不同的是, 它们不会进行回溯.

> 匹配不成功则会抛出异常

##### `& expression`
尝试去匹配表达式. 如果匹配成功, 则返回`undefined`而且不会消耗输入字符串, 否则认为匹配失败.

> 匹配不成功则会抛出异常

##### `! expression`
尝试去匹配表达式. 如果匹配不成功, 则返回`undefined`而且不会消耗输入字符串, 否则认为匹配失败.

> 匹配不成功则会抛出异常

##### `& { predicate }`
The predicate is a piece of JavaScript code that is executed as if it was inside a function. It gets the match results of labeled expressions in preceding expression as its arguments. It should return some JavaScript value using the return statement. If the returned value evaluates to true in boolean context, just return undefined and do not consume any input; otherwise consider the match failed.

The code inside the predicate can access all variables and functions defined in the initializer at the beginning of the grammar.

The code inside the predicate can also access location information using the location function. It returns an object like this:
```javascript
{
  start: { offset: 23, line: 5, column: 6 },
  end:   { offset: 23, line: 5, column: 6 }
}
```
The start and end properties both refer to the current parse position. The offset property contains an offset as a zero-based index and line and column properties contain a line and a column as one-based indices.

The code inside the predicate can also access options passed to the parser using the options variable.

Note that curly braces in the predicate code must be balanced.

##### `! { predicate }`
The predicate is a piece of JavaScript code that is executed as if it was inside a function. It gets the match results of labeled expressions in preceding expression as its arguments. It should return some JavaScript value using the return statement. If the returned value evaluates to false in boolean context, just return undefined and do not consume any input; otherwise consider the match failed.

The code inside the predicate can access all variables and functions defined in the initializer at the beginning of the grammar.

The code inside the predicate can also access location information using the location function. It returns an object like this:

```javascript
{
  start: { offset: 23, line: 5, column: 6 },
  end:   { offset: 23, line: 5, column: 6 }
}
```

The start and end properties both refer to the current parse position. The offset property contains an offset as a zero-based index and line and column properties contain a line and a column as one-based indices.

The code inside the predicate can also access options passed to the parser using the options variable.

Note that curly braces in the predicate code must be balanced.

##### `$ expression`
尝试匹配该表达式. 如果匹配成功, 不会返回匹配结果, 而是返回匹配成功的字符串.

> 匹配不成功则会抛出异常

##### `label : expression`
匹配表达式, 然后将匹配结果存储在`label`里. `label`必须是一个JavaScript标识符. 

##### `expression1 expression2 ... expressionn`
匹配一个表达式列表, 将全部的匹配结果放到一个数组中返回.

##### `expression { action }`
如果匹配表达式成功, 则运行action, 否则认为匹配失败.

> 匹配失败返回异常.

`action`是一段JavaScript代码, 可以把它当做一个方法来运行. labeled表达式的匹配结果会被当做action的参数, 传递给action. action应该通过`return`返回一个JavaScript结果, 该结果会被当做前面表达式的匹配结果.

在action代码块中, 遇到非预期情况, 想要中断parse可以调用`expected`方法, 该方法会抛出一个异常. `expected`方法接受俩个参数, 第一个参数是`description`, 表明当前位置期望输入以及可选的`location`信息(默认值是what location would return). `description`会被当做exception中的message的一部分.

在action代码中也可以调用`error`方法, 该方法也会抛出一个异常. `error`方法接受俩个参数, 第一个参数是error message, 第二个参数是可选的location信息(默认值是 what location would return). message会在抛出异常中使用. 
action中的代码块可以访问初始器中定义的方法和变量. action代码块的左右大括号必须都在.
action 代码块中可以通过`text`方法访问匹配成功的字符.
action代码块中还可以通过访问`location`方法得到location信息, 该方法会返回下面这种对象.

```javascript
{
  start: { offset: 23, line: 5, column: 6 },
  end:   { offset: 25, line: 5, column: 8 }
}
```
`start`属性指向了表达式开始位置, `end`属性指向表达式的结束位置. `offset`是一个基于0 的offset索引位置, `line`和 `column` 属性是基于1的索引位置.

action 代码块中可以通过`options`变量访问传递给parser的options.

##### `expression1 / expression2 / ... / expressionn`
按照顺序从左往右一次匹配, 返回第一个匹配成功的结果. 如果都匹配不成功, 则认为匹配失败.
> 匹配失败返回异常.

## Compatibility
arser generator 和 generated parsers 在以下环境都可以正常运行.
* Node.js 0.10.0+
* Internet Explorer 8+
* Edge
* Firefox
* Chrome
* Safari
* Opera