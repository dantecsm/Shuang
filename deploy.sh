#!/bin/bash

# 双拼练习网站部署脚本
# 使用方法: ./deploy.sh

set -e

# 配置
HOST="root@morefine"
REMOTE_PATH="/opt/websites/shuang"
DEPLOY_DIR="deploy"

echo "🚀 开始部署双拼练习网站..."

# 检查必要文件
echo "📋 检查必要文件..."
if [ ! -f "index.html" ]; then
    echo "❌ index.html 不存在，请先运行 npm run build"
    exit 1
fi

if [ ! -d "build" ]; then
    echo "❌ build 目录不存在，请先运行 npm run build"
    exit 1
fi

if [ ! -d "img" ]; then
    echo "❌ img 目录不存在"
    exit 1
fi

# 清理旧的部署目录
echo "🧹 清理旧的部署目录..."
if [ -d "$DEPLOY_DIR" ]; then
    rm -rf "$DEPLOY_DIR"
fi

# 创建部署目录
echo "📁 创建部署目录..."
mkdir -p "$DEPLOY_DIR"

# 复制文件
echo "📦 复制文件到部署目录..."
cp index.html "$DEPLOY_DIR/"
cp -r build "$DEPLOY_DIR/"
cp -r img "$DEPLOY_DIR/"

# 创建部署信息文件
echo "📝 创建部署信息文件..."
cat > "$DEPLOY_DIR/deploy-info.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "$(node -p "require('./package.json').version")",
  "files": ["index.html", "build", "img"]
}
EOF

# 检查SSH连接
echo "🔌 检查SSH连接..."
if ! ssh -o ConnectTimeout=10 "$HOST" "echo 'SSH连接正常'" > /dev/null 2>&1; then
    echo "❌ 无法连接到主机 $HOST"
    echo "请确保SSH密钥已配置或使用密码认证"
    exit 1
fi

# 创建远程目录
echo "📂 创建远程目录..."
ssh "$HOST" "mkdir -p $REMOTE_PATH"

# 上传文件
echo "⬆️  上传文件到主机..."
scp -r "$DEPLOY_DIR"/* "$HOST:$REMOTE_PATH/"

# 设置文件权限
echo "🔐 设置文件权限..."
ssh "$HOST" "chmod -R 755 $REMOTE_PATH"

# 显示部署信息
echo ""
echo "✅ 部署完成！"
echo "📍 访问地址: http://shuang.morefine/"
echo "📁 远程路径: $REMOTE_PATH"
echo "⏰ 部署时间: $(date)"
echo ""

# 清理本地部署目录（可选）
read -p "是否清理本地部署目录? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$DEPLOY_DIR"
    echo "🧹 本地部署目录已清理"
fi
