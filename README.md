# node_admin
node

## .env
```dotenv
#淘宝cookie
tm_cookies = 
#产品id
tm_product_id = 653554283653
#是否保存图片 0 | 1
tm_is_save_photo = 1
#从第几页开始
tm_page = 1
#筛选长度
tm_select_length = 15
#强制长度
tm_select_qz = 0
#到哪结束
tm_end = *
#是否天猫
tm_is = 1
#是否打开折叠
tm_fold = 0

#pdd
pdd_goods_id = 220443984937
#是否保存图片 0 | 1
pdd_is_save_photo = 1
#筛选长度
pdd_select_length = 15
#强制长度
pdd_select_qz = 0
#到哪结束
pdd_end = *
```
## 问大家的提取
```dotenv
前台问大家提取
#运行npm run tm-pro，问大家，打开之后可以多刷新一次，
#复制json文件到浏览器问题列表
#https://web.m.taobao.com/app/mtb/ask-everyone/list?pha=true&disableNav=YES&refId=#id
#之后去问题列表详情页 打开 执行 pro_start()
#复制出来所有问题列表+回答到json1.json里面
#再次运行 npm run tm-pro-pr 将把问题写入 json.text里面

后台问大家提取
#复制tm-ask-download-hou.js到浏览器，然后打开后台的问大家管理页面，搜索{product_id}
#控制台调度函数：startReadAsk();会下载{product_id}-问大家.zip
```

## 提取评价
```
前台下载评价
#复制tm-comments-download.js到浏览器，然后打开评价页面，按照时间排序
#控制器调取函数：startReadComent();会下载{product_id}.zip

后台下载评价
#复制tm-comments-download-hou.js到浏览器，然后打开后台的评价管理页面，搜索{product_id}
#控制台调度函数：startReadComent();会下载{product_id}.zip
```

## cnpm
```
cnpm的安装方法：https://www.npmmirror.com/
sqlite的可视化工具：https://www.zzxworld.com/posts/10-gui-clients-for-sqlite-db，推荐Antares
```