---
category: 编程语言
tag: PYTHON2
date: 2017-06-13
title: PYTHON 处理XML
---

需求
在实际应用中，需要对xml配置文件进行实时修改，

1. 增加、删除 某些节点
2. 增加，删除，修改某个节点下的某些属性
3. 增加，删除，修改某些节点的文本

使用xml文档
```xml
<?xml version="1.0" encoding="UTF-8"??>
<framework>
  <processers>
    <processer name="AProcesser" file="lib64/A.so" path="/tmp"/>
    <processer name="BProcesser" file="lib64/B.so" value="fordelete"/>
    <processer name="BProcesser" file="lib64/B.so2222222"/>
    <services>
      <service name="search" prefix="/bin/search?" output_formatter="OutPutFormatter:service_inc">
        <chain sequency="chain1"/>
        <chain sequency="chain2"/>
      </service>
      <service name="update" prefix="/bin/update?">
        <chain sequency="chain3" value="fordelete"/>
      </service>
    </services>
  </processers>
</framework>
```

实现思想: 使用ElementTree，先将文件读入，解析成树，之后，根据路径，可以定位到树的每个节点，再对节点进行修改，最后直接将其输出

实现代码
```python
#!/usr/bin/python
# -*- coding=utf-8 -*-
# author : wklken@yeah.net
# date: 2012-05-25
# version: 0.1
 
from xml.etree.ElementTree import ElementTree,Element
 
def read_xml(in_path):
  '''读取并解析xml文件
    in_path: xml路径
    return: ElementTree'''
  tree = ElementTree()
  tree.parse(in_path)
  return tree
 
def write_xml(tree, out_path):
  '''将xml文件写出
    tree: xml树
    out_path: 写出路径'''
  tree.write(out_path, encoding="utf-8",xml_declaration=True)
 
def if_match(node, kv_map):
  '''判断某个节点是否包含所有传入参数属性
    node: 节点
    kv_map: 属性及属性值组成的map'''
  for key in kv_map:
    if node.get(key) != kv_map.get(key):
      return False
  return True
 
#---------------search -----
def find_nodes(tree, path):
  '''查找某个路径匹配的所有节点
    tree: xml树
    path: 节点路径'''
  return tree.findall(path)
 
def get_node_by_keyvalue(nodelist, kv_map):
  '''根据属性及属性值定位符合的节点，返回节点
    nodelist: 节点列表
    kv_map: 匹配属性及属性值map'''
  result_nodes = []
  for node in nodelist:
    if if_match(node, kv_map):
      result_nodes.append(node)
  return result_nodes
 
#---------------change -----
def change_node_properties(nodelist, kv_map, is_delete=False):
  '''修改/增加 /删除 节点的属性及属性值
    nodelist: 节点列表
    kv_map:属性及属性值map'''
  for node in nodelist:
    for key in kv_map:
      if is_delete:
        if key in node.attrib:
          del node.attrib[key]
      else:
        node.set(key, kv_map.get(key))
 
def change_node_text(nodelist, text, is_add=False, is_delete=False):
  '''改变/增加/删除一个节点的文本
    nodelist:节点列表
    text : 更新后的文本'''
  for node in nodelist:
    if is_add:
      node.text += text
    elif is_delete:
      node.text = ""
    else:
      node.text = text
 
def create_node(tag, property_map, content):
  '''新造一个节点
    tag:节点标签
    property_map:属性及属性值map
    content: 节点闭合标签里的文本内容
    return 新节点'''
  element = Element(tag, property_map)
  element.text = content
  return element
 
def add_child_node(nodelist, element):
  '''给一个节点添加子节点
    nodelist: 节点列表
    element: 子节点'''
  for node in nodelist:
    node.append(element)
 
def del_node_by_tagkeyvalue(nodelist, tag, kv_map):
  '''同过属性及属性值定位一个节点，并删除之
    nodelist: 父节点列表
    tag:子节点标签
    kv_map: 属性及属性值列表'''
  for parent_node in nodelist:
    children = parent_node.getchildren()
    for child in children:
      if child.tag == tag and if_match(child, kv_map):
        parent_node.remove(child)
 
if __name__ == "__main__":
  #1. 读取xml文件
  tree = read_xml("./test.xml")
 
  #2. 属性修改
   #A. 找到父节点
  nodes = find_nodes(tree, "processers/processer")
   #B. 通过属性准确定位子节点
  result_nodes = get_node_by_keyvalue(nodes, {"name":"BProcesser"})
   #C. 修改节点属性
  change_node_properties(result_nodes, {"age": "1"})
   #D. 删除节点属性
  change_node_properties(result_nodes, {"value":""}, True)
 
  #3. 节点修改
   #A.新建节点
  a = create_node("person", {"age":"15","money":"200000"}, "this is the firest content")
   #B.插入到父节点之下
  add_child_node(result_nodes, a)
 
  #4. 删除节点
    #定位父节点
  del_parent_nodes = find_nodes(tree, "processers/services/service")
    #准确定位子节点并删除之
  target_del_node = del_node_by_tagkeyvalue(del_parent_nodes, "chain", {"sequency" : "chain1"})
 
  #5. 修改节点文本
    #定位节点
  text_nodes = get_node_by_keyvalue(find_nodes(tree, "processers/services/service/chain"), {"sequency":"chain3"})
  change_node_text(text_nodes, "new text")
 
  #6. 输出到结果文件
  write_xml(tree, "./out.xml")
```

如果想要导入注释的话, 可以
```python
class CommentedTreeBuilder(TreeBuilder):
    def __init__(self, *args, **kwargs):
        super(CommentedTreeBuilder, self).__init__(*args, **kwargs)

    def comment(self, data):
        self.start(Comment, {})
        self.data(data)
        self.end(Comment)

def read_xml(in_path):
    parser = XMLParser(target = CommentedTreeBuilder())

    tree = ElementTree()
    tree.parse(in_path, parser = parser)
    return tree
```

但是一定要导入
```
from xml.etree.ElementTree import ElementTree, TreeBuilder, XMLParser, Comment
```

实际应用
```python
#!/usr/bin/python
# -*- coding: utf-8 -*-
import sys
import os
from xml.etree.ElementTree import ElementTree, TreeBuilder, XMLParser, Comment

reload(sys)
sys.setdefaultencoding('utf-8')

# 生成配置

# copy commons-server.cfg.xml
def copy_commons():
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", copy_commons_file)
    pass

def copy_commons_file(node):
    database = read_xml("./configs/commons-server.cfg.xml")
    server_id = str(node.find("serverId").text)
    slot = str(node.find("slot").text)
    dir_name = server_id + "_" + str(node.find("clientConnectIP").text) + "_" + slot
    write_xml(database, dir_name, "commons-server.cfg.xml")

# 生成服务器配置
def generate_server_configs():
    '''
    修改IP
    修改端口：
        group 16_X_00, 15_X_16
        zone 17_X_00, 15_X_17
        gateway 18_X_00, 15_X_18
        login 19_X_00, 15_X_19
        '''
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", generate_server_config)
    pass

def generate_server_config(node):
    slot = str(node.find("slot").text)
    server_id = str(node.find("serverId").text)
    open_time = str(node.find("opentime").text)
    client_connect_ip = str(node.find("clientConnectIP").text)
    local_ip = str(node.find("localIP").text)

    database = read_xml("./configs/server.cfg.xml")

    # common 配置
    modify_node(database, "common/server-params",  {"name": "server.opentime"}, open_time)

    # 生成group配置
    group_local_port = "16" + str(slot) + "00"
    group_web_port = "15" + str(slot) + "16"
    modify_node(database, "groupserver/server-params",  {"name": "server.groupid"}, server_id)
    modify_node(database, "groupserver/server-params",  {"name": "server.localport"}, group_local_port)
    modify_node(database, "groupserver/server-params",  {"name": "server.webport"}, group_web_port)
    modify_node(database, "groupserver/server-params",  {"name": "crash.file"}, "/tmp/crash_group_" + slot)

    # 生成zone配置
    zone_local_port = "17" + str(slot) + "00"
    zone_web_port = "15" + str(slot) + "17"
    modify_node(database, "zoneserver/server1/server-params", {"name": "groupserver.localport"}, group_local_port)
    modify_node(database, "zoneserver/server1/server-params", {"name": "server.localport"},zone_local_port)
    modify_node(database, "zoneserver/server1/server-params", {"name": "server.webport"}, zone_web_port)
    modify_node(database, "zoneserver/server1/server-params",  {"name": "/tmp/crash.file"}, "crash_zone_" + slot)

    # 生成gateway配置
    gateway_local_port = "18" + str(slot) + "00"
    gateway_web_port = "15" + str(slot) + "18"
    modify_node(database, "gatewayserver/server-params", {"name": "groupserver.localport"}, group_local_port)
    modify_node(database, "gatewayserver/server-params", {"name": "server.localport"}, gateway_local_port)
    modify_node(database, "gatewayserver/server-params", {"name": "server.remoteaddr"}, local_ip)
    modify_node(database, "gatewayserver/server-params", {"name": "server.remoteport"}, gateway_local_port)
    modify_node(database, "gatewayserver/server-params", {"name": "server.client.connectaddr"}, client_connect_ip)
    modify_node(database, "gatewayserver/server-params", {"name": "server.client.connectport"}, gateway_local_port)
    modify_node(database, "gatewayserver/server-params", {"name": "server.webport"}, gateway_web_port)

    # 生成login配置
    login_local_port = "19" + str(slot) + "00"
    login_web_port = "15" + str(slot) + "19"
    modify_node(database, "loginserver/server-params", {"name": "groupserver.localport"}, group_local_port)
    modify_node(database, "loginserver/server-params", {"name": "server.localport"}, login_local_port)
    modify_node(database, "loginserver/server-params", {"name": "server.remoteaddr"}, local_ip)
    modify_node(database, "loginserver/server-params", {"name": "server.remoteport"}, login_local_port)
    modify_node(database, "loginserver/server-params", {"name": "server.webport"}, login_web_port)

    dir_name = server_id + "_" + str(node.find("clientConnectIP").text) + "_" + slot
    write_xml(database, dir_name, "server.cfg.xml")
    pass

def modify_node(config, tag, path, value):
    text_nodes = get_node_by_keyvalue(find_nodes(config, tag), path)
    change_node_properties(text_nodes, {"value": value})

# 生成redis配置
def generate_redis_configs():
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", generate_redis_config)
    pass

def generate_redis_config(node):
    server_id = str(node.find("serverId").text)
    slot = str(node.find("slot").text)
    redis_ip = str(node.find("redis_ip").text)
    redis_auth = str(node.find("redis_auth").text)
    database = read_xml("./configs/redis.cfg.xml")

    modify_node(database, "redis-params", {"name": "redis.db"}, slot)
    modify_node(database, "redis-params", {"name": "redis.addr"}, redis_ip)
    modify_node(database, "redis-params", {"name": "redis.auth"}, redis_auth)

    dir_name = server_id + "_" + str(node.find("clientConnectIP").text) + "_" + slot
    write_xml(database, dir_name , "redis.cfg.xml")
    pass

# 生成游戏mysql配置
def generate_mysql_configs():
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", generate_mysql_config)
    pass

def generate_mysql_config(node):
    database = read_xml("./configs/database.cfg.xml")
    server_id = str(node.find("serverId").text)
    slot = str(node.find("slot").text)
    mysql_ip = str(node.find("mysql_ip").text)
    mysql_username = str(node.find("mysql_username").text)
    mysql_password = str(node.find("mysql_password").text)

    modify_node(database, "db-params", {"name": "connection.url"}, "jdbc:mysql://" + mysql_ip + ":3306/c2x_game_" + server_id)
    modify_node(database, "db-params", {"name": "connection.username"}, mysql_username)
    modify_node(database, "db-params", {"name": "connection.password"}, mysql_password)

    dir_name = server_id + "_" + str(node.find("clientConnectIP").text) + "_" + slot
    write_xml(database, dir_name, "database.cfg.xml")
    pass

# 生成游戏log  mysql配置
def generate_log_mysql_configs():
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", generate_log_mysql_config)
    pass

def generate_log_mysql_config(node):
    server_id = str(node.find("serverId").text)
    database = read_xml("./configs/logdb/databaseConnection.xml")
    slot = str(node.find("slot").text)
    mysql_ip = str(node.find("mysql_ip").text)
    mysql_username = str(node.find("mysql_username").text)
    mysql_password = str(node.find("mysql_password").text)

    modify_node(database, "environments/environment/dataSource/property", {"name": "jdbcUrl"}, "jdbc:mysql://"+mysql_ip+":3306/c2x_logs_" + server_id)
    modify_node(database, "environments/environment/dataSource/property", {"name": "user"}, mysql_username)
    modify_node(database, "environments/environment/dataSource/property", {"name": "password"}, mysql_password)

    dir_name = server_id + "_" + str(node.find("clientConnectIP").text) + "_" + slot

    write_xml(database, dir_name, "databaseConnection.xml", "logdb/")
    out_path = "./generate/" + dir_name + "/configs/logdb/"
    append_doctype(out_path + "/databaseConnection.xml" )
    pass

def append_doctype(file_path):
    doctype = '''<!DOCTYPE configuration
                PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
                "http://mybatis.org/dtd/mybatis-3-config.dtd">\n'''

    fileold = open(file_path, "rb+")
    configfile_list = fileold.readlines()
    fileold.close()

    configfile_list.insert(1, doctype)

    if not os.path.exists(file_path):
        os.makedirs(file_path)

    filenew = open(file_path, "wb")
    for item in configfile_list:
        filenew.write(item)
    filenew.close()

# 在SQL文件中添加创建语句
def generateSQLFiles():
    config = read_xml("./config.xml")
    iterate_nodes(config, "server-configurations", generateSQLFile)
    pass

def generateSQLFile(node):
    slot = str(node.find("slot").text)
    if find_nodes(node, "game_sql_path"):
        game_sql_path = str(node.find("game_sql_path").text)
        append_content2sql_file(game_sql_path, slot, "c2x_game_" + slot)

    if find_nodes(node, "log_sql_path"):
        log_sql_path = str(node.find("log_sql_path").text)
        append_content2sql_file(log_sql_path, slot, "c2x_logs_" + slot)

def append_content2sql_file(sql_path, slot, database):
    fileold = open(sql_path, "rb+")
    configfile_list = fileold.readlines()
    fileold.close()
    tarline = 0
    for i in range(configfile_list.__len__()):
        if configfile_list[i].__contains__("SET FOREIGN_KEY_CHECKS=0;"):
            tarline = int(i) + 1

    if tarline == 0:
        print sql_path + "(" +database + ") : 没有找到 SET FOREIGN_KEY_CHECKS=0;, 无法完成追加操作"
        return

    addinfo = '''CREATE DATABASE /*!32312 IF NOT EXISTS*/`'''+ database + ''' ` /*!40100 DEFAULT CHARACTER SET utf8 */; \n''' + \
    '''USE `''' + database + '''`;\n'''
    configfile_list.insert(tarline, addinfo)

    out_path = "./generate/"+slot+"/sql/"
    if not os.path.exists(out_path):
        os.makedirs(out_path)

    filenew = open(out_path + database + ".sql", "wb")
    for item in configfile_list:
        filenew.write(item)
    filenew.close()

# XML API
class CommentedTreeBuilder(TreeBuilder):
    def __init__(self, *args, **kwargs):
        super(CommentedTreeBuilder, self).__init__(*args, **kwargs)

    def comment(self, data):
        self.start(Comment, {})
        self.data(data)
        self.end(Comment)

def read_xml(in_path):
    treeBuilder = CommentedTreeBuilder()
    parser = XMLParser(target = treeBuilder)

    tree = ElementTree()
    tree.parse(in_path, parser = parser)

    return tree

def write_xml(tree, slot, filename, extra=""):
    out_path = "./generate/" + slot + "/configs/" + str(extra)
    if not os.path.exists(out_path):
        os.makedirs(out_path)
    full_name = str(out_path) + str(filename)
    tree.write(full_name, encoding="utf-8", xml_declaration=True, )

def iterate_nodes(config, path, action):
    nodes = find_nodes(config, path)
    for cur_node in nodes:
        for node in cur_node :
            action(node)
    pass

def find_nodes(tree, path):
    return tree.findall(path)

def get_node_by_keyvalue(nodelist, kv_map):
    result_nodes = []
    for node in nodelist:
        if if_match(node, kv_map):
            result_nodes.append(node)
    return result_nodes

def if_match(node, kv_map):
    for key in kv_map:
        if node.get(key) != kv_map.get(key):
            return False
    return True

def change_node_properties(nodelist, kv_map, is_delete=False):
    for node in nodelist:
        for key in kv_map:
            if is_delete:
                if key in node.attrib:
                    del node.attrib[key]
            else:
                node.set(key, kv_map.get(key))

# 开始生成配置
copy_commons();
generate_mysql_configs();
generate_log_mysql_configs();
generate_redis_configs();
generate_server_configs();
```