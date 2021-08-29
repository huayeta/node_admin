# node_admin
node

## .env
```dotenv
#产品id
tm_product_id = 614123140758
#是否保存图片 0 | 1
tm_is_save_photo = 1
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
```dotenv
#问大家，打开之后可以多刷新一次，之后把问题列表保存到json.json里面
npm run tm-pro 
#之后去问题列表详情页 打开 执行 pro_start()
#复制出来所有问题列表+回答道json1.json里面
#再次运行 npm run tm-pro-pr 将把问题写入 json.text里面
```