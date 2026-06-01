# 迁移到外接硬盘

目标目录：

```text
/Volumes/SUNI777/知食分子
```

当前会话里系统只给了读取权限，写入外接盘会返回 `Operation not permitted`。等写入权限放开后，可以执行：

```bash
mkdir -p "/Volumes/SUNI777/知食分子"
cp -R "/Users/suni/Documents/New project/zhishifenzi-mvp" "/Volumes/SUNI777/知食分子/"
```

迁移后进入：

```bash
cd "/Volumes/SUNI777/知食分子/zhishifenzi-mvp"
python3 -m http.server 4173
```

打开：

```text
http://127.0.0.1:4173
```

如果浏览器本地已经有数据，可以先在当前版本右上角点“导出”，迁移后再点“导入”。
