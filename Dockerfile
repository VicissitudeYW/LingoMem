# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制项目文件
COPY . .

# 创建 cards 目录
RUN mkdir -p cards

# 暴露端口
EXPOSE 45000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "server.js"]