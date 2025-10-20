# 双拼练习网站部署说明

## 快速部署

### 方法一：使用npm脚本（推荐）

**使用rsync（如果主机支持）:**
```bash
# 完整部署流程（构建 + 准备 + 上传）
npm run deploy

# 或者分步执行
npm run build          # 构建项目
npm run deploy:prepare # 准备部署文件
npm run deploy:upload  # 上传到主机
```

**使用scp（推荐，兼容性更好）:**
```bash
# 完整部署流程（构建 + 准备 + 上传）
npm run deploy:scp

# 或者分步执行
npm run build              # 构建项目
npm run deploy:scp:prepare # 准备部署文件
npm run deploy:scp:upload  # 上传到主机
```

### 方法二：使用脚本文件

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```cmd
deploy.bat
```

## 部署配置

- **主机**: `root@morefine`
- **远程路径**: `/opt/websites/shuang`
- **本地部署目录**: `deploy/`

## nginx配置

1. 将 `nginx.conf.template` 复制到服务器：
```bash
scp nginx.conf.template root@morefine:/etc/nginx/sites-available/shuang-practice
```

2. 在服务器上启用站点：
```bash
ssh root@morefine
ln -s /etc/nginx/sites-available/shuang-practice /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 部署文件结构

```
deploy/
├── index.html          # 主页面
├── build/              # 构建后的JS和CSS文件
│   ├── app.min.js
│   ├── style.min.css
│   └── ...
├── img/                # 图片资源
│   ├── ziranma.svg
│   ├── ziranma.png
│   └── ...
└── deploy-info.json    # 部署信息
```

## 访问地址

部署完成后，可通过以下地址访问：
- `http://shuang.morefine/`
- `http://[服务器IP]/shuang`

## 故障排除

### 1. SSH连接问题
```bash
# 测试SSH连接
ssh root@morefine "echo '连接成功'"

# 如果使用密码认证，确保已安装sshpass
# Ubuntu: sudo apt install sshpass
# CentOS: sudo yum install sshpass
```

### 2. 文件权限问题
```bash
# 在服务器上设置正确权限
ssh root@morefine "chmod -R 755 /opt/websites/shuang"
```

### 3. nginx配置问题
```bash
# 测试nginx配置
ssh root@morefine "nginx -t"

# 查看nginx错误日志
ssh root@morefine "tail -f /var/log/nginx/error.log"
```

### 4. 端口访问问题
```bash
# 检查nginx是否运行
ssh root@morefine "systemctl status nginx"

# 检查端口是否监听
ssh root@morefine "netstat -tlnp | grep :80"
```

## 更新部署

当代码有更新时，只需重新运行部署命令：

```bash
npm run deploy
```

脚本会自动：
1. 重新构建项目
2. 准备新的部署文件
3. 上传到服务器
4. 设置正确的文件权限
