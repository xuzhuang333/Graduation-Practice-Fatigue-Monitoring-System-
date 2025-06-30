// src/services/api.js
// API服务层 - 处理与后端的所有通信

// 基础URL配置
const API_BASE_URL = 'http://192.168.70.167:8000';

// 开发模式标志 - 设置为false将使用真实API
const DEV_MODE = false;

/**
 * 基础HTTP请求方法
 */
async function makeRequest(endpoint, method = 'GET', data = null) {
  // 移除对已删除函数的引用
  // if (DEV_MODE) {
  //   return simulateRequest(endpoint, method, data);
  // }
  
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  const options = {
    method,
    headers,
    cache: 'no-store'
  };

  // 添加请求体
  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`[API] 发送${method}请求到: ${url}`, options);
    
    const response = await fetch(url, options);
    
    console.log(`[API] 收到响应: ${response.status}`);
    
    // 检查HTTP状态码
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch (e) {
        // 无法解析为JSON，使用默认消息
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`[API] 请求失败: ${error.message}`);
    throw error;
  }
}



/**
 * 身份验证服务
 */
const auth = {
  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @param {string} role - 用户角色
   */
  async login(username, password, role) {
    try {
      return await makeRequest('/api/v1/login', 'POST', {
        username,
        password,
        role
      });
    } catch (error) {
      console.error('[API] 登录失败:', error);
      throw error;
    }
  }
};

/**
 * 用户信息服务
 */
const user = {
  /**
   * 获取用户个人信息
   * @param {string} username - 用户名
   * @returns {Promise<Object>} 用户个人信息
   */
  async getUserInfo(username) {
    try {
      // 使用正确的后端地址
      return await fetch('http://192.168.70.167:8000/api/v2/userinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      }).then(res => res.json());
    } catch (error) {
      console.error('[API] 获取用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 更新用户个人信息
   * @param {Object} userInfo - 用户个人信息
   * @param {string} userInfo.username - 用户名
   * @param {string} userInfo.gender - 性别
   * @param {string} userInfo.age - 年龄
   * @param {string} userInfo.folk - 民族
   * @param {string} userInfo.work - 职业
   * @param {string} userInfo.location - 地区
   * @returns {Promise<Object>} 更新结果
   */
  async updateUserInfo(userInfo) {
    try {
      return await fetch('http://192.168.70.167:8000/api/v2/changeuserinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userInfo)
      }).then(res => res.json());
    } catch (error) {
      console.error('[API] 更新用户信息失败:', error);
      throw error;
    }
  },

  /**
   * 修改用户密码
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.username - 用户名
   * @param {string} passwordData.old_password - 原密码
   * @param {string} passwordData.new_password - 新密码
   * @param {string} passwordData.confirm_password - 确认密码
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(passwordData) {
    try {
      const response = await fetch('http://192.168.70.167:8000/api/v2/changepassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '密码修改失败');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[API] 修改密码失败:', error);
      throw error;
    }
  }
};

/**
 * 系统状态服务
 */
const system = {
  /**
   * 获取系统状态统计信息
   * @returns {Promise<Object>} 系统状态统计信息
   */
  async getSystemStats() {
    try {
      // 使用默认系统状态
      return {
        code: 200,
        data: {
          systemStatus: '100%',
          totalVehicles: 28 // 默认值
        }
      };
    } catch (error) {
      console.error('[API] 获取系统状态统计失败:', error);
      throw error;
    }
  },
  
  /**
   * 获取用户统计数据
   * @returns {Promise<Object>} 用户统计信息
   */
  async getUserStats(adminInfo) {
    try {
      // 使用已有的用户管理API
      const response = await fetch('http://192.168.70.167:8000/api/v3/showuserinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: adminInfo.username,
          role: adminInfo.role
        })
      });
      
      const result = await response.json();
      console.log('[API] 用户列表API响应:', result);
      
      if (result.code === 200 && result.data) {
        // 统计不同角色的用户数量
        const users = result.data;
        let driverCount = 0;
        let monitorCount = 0;
        let adminCount = 0;
        
        users.forEach(user => {
          if (user.role === '驾驶员') driverCount++;
          else if (user.role === '监管员') monitorCount++;
          else if (user.role === '管理员') adminCount++;
        });
        
        return {
          code: 200,
          data: {
            totalUsers: users.length,
            driverCount,
            monitorCount,
            adminCount
          }
        };
      } else {
        throw new Error(result.message || '获取用户统计失败');
      }
    } catch (error) {
      console.error('[API] 获取用户统计失败:', error);
      // 返回默认值，防止UI崩溃
      return {
        code: 500,
        data: {
          totalUsers: 0,
          driverCount: 0,
          monitorCount: 0,
          adminCount: 0
        },
        message: error.message
      };
    }
  },
  
  /**
   * 获取疲劳事件统计数据
   * @returns {Promise<Object>} 疲劳事件统计信息
   */
  async getFatigueStats() {
    try {
      // 使用已有的疲劳监控API
      const response = await fetch('http://192.168.70.167:8000/api/v2/showfatigue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const result = await response.json();
      console.log('[API] 疲劳监控API响应:', result);
      
      if (result.code === 200 && result.data) {
        // 统计疲劳事件数量和活跃监控数
        const fatigueEvents = result.data;
        
        // 获取唯一的活跃驾驶员数量
        const activeDrivers = new Set();
        fatigueEvents.forEach(event => {
          if (event.username) {
            activeDrivers.add(event.username);
          }
        });
        
        return {
          code: 200,
          data: {
            fatigueEventCount: fatigueEvents.length,
            activeFatigueCount: activeDrivers.size
          }
        };
      } else {
        throw new Error(result.message || '获取疲劳事件统计失败');
      }
    } catch (error) {
      console.error('[API] 获取疲劳事件统计失败:', error);
      // 返回默认值，防止UI崩溃
      return {
        code: 500,
        data: {
          fatigueEventCount: 0,
          activeFatigueCount: 0
        },
        message: error.message
      };
    }
  }
};

// 导出API服务
const apiService = {
  auth,
  user,
  system
};

// 不要尝试修改window.api，而是导出我们自己的apiService
export default apiService;
