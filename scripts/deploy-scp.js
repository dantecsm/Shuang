#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// 配置信息
const config = {
  host: 'root@morefine',
  remotePath: '/opt/websites/shuang',
  deployDir: 'deploy',
  files: [
    'index.html',
    'build',
    'img'
  ]
};

function log(message) {
  console.log(`[DEPLOY] ${message}`);
}

function error(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function prepareDeploy() {
  log('开始准备部署文件...');
  
  // 检查必要文件是否存在
  const requiredFiles = ['index.html', 'build', 'img'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      error(`必要文件不存在: ${file}`);
    }
  }
  
  // 清理旧的部署目录
  if (fs.existsSync(config.deployDir)) {
    log('清理旧的部署目录...');
    fs.removeSync(config.deployDir);
  }
  
  // 创建部署目录
  fs.ensureDirSync(config.deployDir);
  
  // 复制文件到部署目录
  for (const file of config.files) {
    const srcPath = file;
    const destPath = path.join(config.deployDir, file);
    
    if (fs.existsSync(srcPath)) {
      log(`复制 ${srcPath} -> ${destPath}`);
      fs.copySync(srcPath, destPath);
    } else {
      error(`源文件不存在: ${srcPath}`);
    }
  }
  
  // 创建部署信息文件
  const deployInfo = {
    timestamp: new Date().toISOString(),
    version: require('../package.json').version,
    files: config.files
  };
  
  fs.writeJsonSync(path.join(config.deployDir, 'deploy-info.json'), deployInfo, { spaces: 2 });
  
  log('部署文件准备完成！');
  log(`部署目录: ${config.deployDir}`);
  log(`包含文件: ${config.files.join(', ')}`);
}

function uploadDeploy() {
  log('开始上传文件到主机...');
  
  if (!fs.existsSync(config.deployDir)) {
    error('部署目录不存在，请先运行 npm run deploy:prepare');
  }
  
  try {
    // 检查SSH连接
    log('检查SSH连接...');
    execSync(`ssh -o ConnectTimeout=10 ${config.host} "echo 'SSH连接正常'"`, { stdio: 'pipe' });
    
    // 创建远程目录
    log('创建远程目录...');
    execSync(`ssh ${config.host} "mkdir -p ${config.remotePath}"`, { stdio: 'pipe' });
    
    // 清理远程目录（可选）
    log('清理远程目录...');
    execSync(`ssh ${config.host} "rm -rf ${config.remotePath}/*"`, { stdio: 'pipe' });
    
    // 使用scp上传文件
    log('上传文件...');
    
    // 分别上传每个文件/目录
    for (const file of config.files) {
      const localPath = path.join(config.deployDir, file);
      if (fs.existsSync(localPath)) {
        log(`上传 ${file}...`);
        const scpCmd = `scp -r "${localPath}" ${config.host}:${config.remotePath}/`;
        execSync(scpCmd, { stdio: 'inherit' });
      }
    }
    
    // 上传部署信息文件
    const deployInfoPath = path.join(config.deployDir, 'deploy-info.json');
    if (fs.existsSync(deployInfoPath)) {
      log('上传部署信息文件...');
      const scpCmd = `scp "${deployInfoPath}" ${config.host}:${config.remotePath}/`;
      execSync(scpCmd, { stdio: 'inherit' });
    }
    
    // 设置文件权限
    log('设置文件权限...');
    execSync(`ssh ${config.host} "chmod -R 755 ${config.remotePath}"`, { stdio: 'pipe' });
    
    log('文件上传完成！');
    log(`访问地址: http://shuang.morefine/`);
    
  } catch (err) {
    error(`上传失败: ${err.message}`);
  }
}

function showHelp() {
  console.log(`
部署脚本使用说明 (使用scp):

命令:
  node scripts/deploy-scp.js prepare  - 准备部署文件
  node scripts/deploy-scp.js upload   - 上传文件到主机
  node scripts/deploy-scp.js help     - 显示帮助信息

配置:
  主机: ${config.host}
  远程路径: ${config.remotePath}
  部署目录: ${config.deployDir}
`);
}

// 主程序
const command = process.argv[2];

switch (command) {
  case 'prepare':
    prepareDeploy();
    break;
  case 'upload':
    uploadDeploy();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    error('未知命令，使用 "node scripts/deploy-scp.js help" 查看帮助');
}
