---
category: 前端
tag: React 
title: React 总结
date: 2022-04-12 10:21:00
---

## React

- JSX 语法
- 组件
  - 函数组件
    - 没有类组件的生命周期
    - 函数式组件没有 this
    - 函数式组件形参是 props 和类组件的 this.props 相同
    - hooks 函数组件状态
      - `const [state, setState] = useState(false);` 缓存状态。 在函数中定义一个状态 on, 和一个改变 on 值的方法 setOn().
      - `useEffect(fn, [state])` 监听状态，状态变化第一个参数会执行，类似于一个 callback 函数，但是没有返回结果。TODO useEffect 在受控组件中的用途？？？
      - `let f = useCallback(fn, [state])` 缓存 fn 函数(fn 默认不执行)。不必每次 render 的时候都创建一遍函数。如果 state 没发生变化，则以后每次调用 f 的时候都不会重新执行 fn
      - `let f = useMemo(fn, [state])` 直接执行 fn 函数，然后 useMemo 返回 fn 结果。如果 state 没有发生变化，则以后直接取上次的缓存结果
      - `let ref = useRef()` 类似于类组件的 ref
      - `useContext` 生产者消费者模型，用于在多个组件间共享数据(看到的例子只有一个生产者，支持多个生产者吗？？？)
      - `useReducer` 
  - 类组件
    - 状态
      - setState() 提交状态， 只有通过这个方式修改 state, react 才会重新渲染页面
      - this.state.xxx 获取状态
      - setState() 同步异步
    - 属性
      - 组件传参
      - 属性获取 this.props.xxx
      - 属性验证 组件名称.propTypes = {} (需要引入 prop-types)
      - 默认属性 组件名称.defaultProps = {}
      - 可以使用 ES6 属性展开 {...obj}
      - 函数式组件属性支持(但是函数式组件 16.8 之前不支持 state)
    - ref 获取组件
  - 函数组件
    - 箭头函数
  - 事件处理
    - this 问题
      - 箭头函数 this 指向外部
      - 普通函数 this 不好用
      - 调用传参
  - 受控
    - 非受控组件 包含 state 的组件，状态组件
    - 受控组件 只包含 props，不包含 state 的组件，无状态组件 (<input value="123">此时就是受控组件，input 框里面的内容是不可修改的)
    - 表单
      - `<input defaultValue="123">` , 这里如果用 defaultValue 替换 value，将受控组件替换为非受控组件
      - `<input value={this.state.name} onChange= (evt)=> {setState({name: evt.target.value})} >` 通过将状态与 value 绑定,
  - 生命周期
- 列表渲染
  - key 值
- 条件渲染
  - 三元操作符，&&操作符
- dangerouslySetInnerHTML
  - 富文本编辑
  - 安全性，如何被攻击

## ES 6

对象合并

```JavaScript
obj1 = {
  a : "123"
}


obj2 = {
  b : "456"
}

obj3 = {...obj1, ...obj2}

// 此时obj3就有了obj1和obj2的内容
```
