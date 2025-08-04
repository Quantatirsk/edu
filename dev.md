# 优教通 MVP - 开发计划 (FastAPI + 前端驱动)

## 1. 项目概述

本项目旨在快速开发一个**优教通平台的最小可行产品 (MVP)**。核心目标是验证核心业务流程：**学生浏览教师、查看详情、并成功预约一节课程**。

为了快速迭代，此 MVP 版本将采用“胖前端”+“瘦后端”的架构。大部分业务逻辑和状态管理将在前端实现，后端仅负责提供基础的数据持久化和 API 服务。我们将暂时省略用户认证、在线支付、实时通讯和管理员后台等复杂功能。

## 2. 技术选型 (MVP Stack)

* **前端 (Frontend):**

  * **框架:** React 18+
  * **构建工具:** Vite
  * **语言:** TypeScript
  * **UI/样式:** Tailwind CSS, lucide-react (沿用现有)
  * **路由:** React Router 6
  * **数据请求:** TanStack Query (v5) (强烈推荐，即便在 MVP 中也能极大简化异步数据处理)
  * **状态管理:** Zustand (用于管理全局状态，如当前模拟的用户角色)
* **后端 (Backend):**

  * **框架:** FastAPI (Python)
  * **数据库:** SQLite (轻量、无需配置的文件数据库，完美契合 MVP)
  * **数据校验:** Pydantic (FastAPI 内置)

## 3. 核心功能模块 (MVP Scope)

#### 3.1. 教师浏览与详情

* **教师列表页:**
  * 从后端 API 获取所有教师数据并展示。
  * 实现**前端驱动**的搜索（按姓名）、筛选（按科目）和排序（按评分、价格等）。
* **教师详情页:**
  * 展示指定教师的完整信息，包括个人简介、资质、教学风格、评分等。
  * 展示该教师收到的所有**课程评价**。

#### 3.2. 课程预约

* **简易预约流程:**
  * 在教师详情页，提供一个“立即预约”按钮，点击后弹出预约表单。
  * 表单包含：`学生姓名` (文本输入)、`预约科目` (下拉选择)、`期望上课日期和时间` (日期时间选择器)。
  * 提交表单后，调用后端 API 创建一条新的预约记录。
* **我的预约页:**
  * 创建一个新页面，用于展示**所有**已创建的预约记录列表。
  * 此页面对所有“用户”可见（因为没有登录体系）。

#### 3.3. 课程评价

* **提交评价:**
  * 在“我的预约”页面，允许用户为已完成的课程提交评价。
  * 评价表单包含：各项评分 (教学、耐心等) 和文字评论。
  * 提交后，调用后端 API 创建一条新的评价记录，并关联到对应的教师。

#### 3.4. 模拟用户切换 (MVP 简化方案)

* 由于没有登录系统，我们将在前端全局（如导航栏）放置一个简单的切换按钮或下拉菜单，用于在**“学生视角”**和**“教师视角”**之间切换。这会影响某些 UI 的显示，例如“预约”按钮只在学生视角下突出显示。

## 4. 数据模型与 API 设计

#### 4.1. 数据模型 (Pydantic Models for FastAPI)

```python
# in main.py or a models.py file

from pydantic import BaseModel
from typing import List, Optional
import datetime

class Location(BaseModel):
    address: str
    district: str

class DetailedRatings(BaseModel):
    teaching: float
    patience: float
    communication: float
    effectiveness: float

class Teacher(BaseModel):
    id: str
    name: str
    avatar: str
    subject: List[str]
    experience: int
    rating: float
    reviews: int
    price: float
    location: Location
    detailedRatings: DetailedRatings
    certifications: List[str]
    teachingStyle: str
    description: str

class Appointment(BaseModel):
    id: int # 数据库自增主键
    teacher_id: str
    student_name: str # MVP: 直接存储学生姓名
    subject: str
    appointment_time: datetime.datetime
    status: str # e.g., 'confirmed'

class Review(BaseModel):
    id: int # 数据库自增主键
    teacher_id: str
    student_name: str # MVP: 直接存储学生姓名
    overall_rating: int
    comment: str
    date: datetime.date
```
