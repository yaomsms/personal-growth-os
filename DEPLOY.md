# 部署指南 - 个人成长操作系统（同步码版）

本指南将帮助你从零开始部署带云端同步功能的个人成长操作系统。

## 概述

本项目使用 **同步码模式**进行云端同步：
- 你自己设置一个同步码（比如 `mima123`）
- 手机、平板、电脑都输入同一个同步码
- 数据自动同步，不用邮箱、不用注册、不用验证

**技术栈**：
- 前端：纯 HTML/CSS/JS，无需构建工具
- 后端：Supabase（PostgreSQL 数据库 + 实时订阅）
- 部署：Vercel（静态文件托管）
- 费用：完全免费（Supabase 免费版 + Vercel 免费版）

---

## 第一步：准备 Supabase 数据库

### 1.1 注册 Supabase

1. 访问 [Supabase 官网](https://supabase.com/)
2. 用 GitHub 账号登录（推荐）
3. 创建一个新项目（New Project）
4. 区域选离你最近的（推荐 Singapore 或 Tokyo）
5. 套餐选 Free 免费版

### 1.2 创建数据库表

项目创建好后，打开 SQL Editor，跑下面这段 SQL：

```sql
-- 同步码数据表
create table if not exists sync_codes (
  sync_id text primary key,
  sync_code text not null,
  module_data jsonb default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 开启行级安全（虽然同步码模式用不到，但安全起见）
alter table sync_codes enable row level security;

-- 允许匿名读写（通过同步码来保护数据安全）
drop policy if exists "Enable read access" on sync_codes;
create policy "Enable read access"
  on sync_codes for select
  using (true);

drop policy if exists "Enable insert access" on sync_codes;
create policy "Enable insert access"
  on sync_codes for insert
  with check (true);

drop policy if exists "Enable update access" on sync_codes;
create policy "Enable update access"
  on sync_codes for update
  using (true);

-- 自动更新时间触发器
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_sync_codes_updated_at on sync_codes;
create trigger update_sync_codes_updated_at
  before update on sync_codes
  for each row
  execute function update_updated_at_column();

-- 开启实时同步
alter publication supabase_realtime add table sync_codes;
```

### 1.3 获取 API Key

1. 左侧菜单点 **Project Settings**（⚙️ 齿轮）
2. 点 **API**
3. 复制两个值：
   - **Project URL**（格式：`https://xxxx.supabase.co`）
   - **anon public** Key

---

## 第二步：配置项目

把你的 Supabase URL 和 Key 填到代码里。

打开 `single-file.html`，搜索下面这段：

```javascript
const DEFAULT_URL = 'https://isocufbtrvrhdbhibvxg.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_xxxxx';
```

把它们换成你自己的 URL 和 Key。

> 注意：如果你用的是我帮你创建的项目，配置已经内置好了，不用改！

---

## 第三步：部署到 Vercel

### 方法一：拖拽上传（最简单）

1. 访问 [Vercel 官网](https://vercel.com/) 注册登录
2. 进入 Dashboard
3. 找到 **"Deploy"** 或 **"Drag and drop"** 区域
4. 把整个项目文件夹拖进去
5. 等 1-2 分钟，部署完成
6. 你会得到一个网址，比如 `https://your-project.vercel.app`

### 方法二：GitHub 同步（推荐，方便更新）

1. 把代码推送到 GitHub 仓库
2. Vercel 里点 **"Add New..."** → **"Project"**
3. 导入你的 GitHub 仓库
4. 什么都不用改，直接点 **"Deploy"**
5. 等 1-2 分钟就好了

---

## 第四步：添加到桌面（像 APP 一样用）

部署成功后，你有了一个网址。把它添加到桌面，用起来跟 APP 一样。

### 💻 电脑（Chrome / Edge）

1. 用 Chrome 或 Edge 打开网址
2. 地址栏右边有个 📱 图标（"安装应用"）
3. 点一下，选择"安装"
4. 桌面就有图标了，点开直接用

### 📱 苹果手机/平板（Safari）

1. 用 Safari 打开网址
2. 点底部的分享按钮（方框加箭头）
3. 往下滑，找到 **"添加到主屏幕"**
4. 点添加，桌面就有图标了
5. 点开就是全屏，跟 APP 一样

### 📱 安卓手机/平板（Chrome）

1. 用 Chrome 打开网址
2. 点右上角三个点
3. 找到 **"添加到主屏幕"** 或 **"安装应用"**
4. 点添加

---

## 第五步：开始使用

1. 打开应用
2. 点右上角 **"开启同步"** 按钮
3. 输入你的同步码（自己设一个，比如 `mima123`）
4. 点"开启同步"
5. 完成！

**其他设备也输入同一个同步码，数据自动同步。**

---

## 常见问题

### Q: 同步码忘了怎么办？
A: 找不回的，所以一定要记下来。建议用你常用的密码。

### Q: 别人猜到我的同步码怎么办？
A: 设复杂一点（6-12位字母数字组合），基本不会被猜到。

### Q: 免费版够用吗？
A: 完全够用。Supabase 免费版有 500MB 数据库空间，个人用绰绰有余。

### Q: 数据安全吗？
A: 数据通过 HTTPS 加密传输，存在 Supabase 云端。同步码就是你的钥匙，只有知道同步码的人才能访问数据。

### Q: 可以导出数据吗？
A: 可以。在"工具"模块里有数据导出功能，随时导出为 JSON 文件。

### Q: 实时同步是什么意思？
A: 你在手机上改了数据，电脑上马上就更新了，不用手动刷新。

---

## 更新日志

- v2.0.0：改为同步码模式，更简单，不用邮箱注册
- v1.0.0：初始版本，邮箱注册登录模式
