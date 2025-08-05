// 认证问题诊断脚本
// 在浏览器控制台中运行此脚本

console.log('🔍 开始诊断认证问题...');

// 1. 检查localStorage中的认证数据
function checkAuthStorage() {
    console.log('\n📊 1. 检查认证存储:');
    
    const authStorage = localStorage.getItem('auth-storage');
    const oldAuthToken = localStorage.getItem('auth_token');
    
    console.log('- auth-storage:', authStorage ? '✅ 存在' : '❌ 不存在');
    console.log('- auth_token (旧):', oldAuthToken ? '⚠️ 存在 (应该清除)' : '✅ 不存在');
    
    if (authStorage) {
        try {
            const parsed = JSON.parse(authStorage);
            console.log('- token 存在:', parsed.state?.token ? '✅' : '❌');
            console.log('- user 存在:', parsed.state?.user ? '✅' : '❌');
            console.log('- isAuthenticated:', parsed.state?.isAuthenticated ? '✅' : '❌');
            
            if (parsed.state?.user) {
                console.log('- 用户角色:', parsed.state.user.role);
                console.log('- 用户ID:', parsed.state.user.id);
            }
            
            return parsed.state?.token;
        } catch (e) {
            console.error('❌ 解析认证数据失败:', e);
            return null;
        }
    }
    
    return null;
}

// 2. 测试API请求头
function testAuthHeader(token) {
    console.log('\n🔑 2. 测试认证头:');
    
    if (!token) {
        console.log('❌ 没有可用的token');
        return;
    }
    
    console.log('✅ Token 存在:', token.substring(0, 50) + '...');
    
    // 模拟API请求配置
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    console.log('✅ 请求头已配置:', config.headers.Authorization.substring(0, 50) + '...');
    return config;
}

// 3. 测试实际API调用
async function testActualAPI(token) {
    console.log('\n📡 3. 测试API调用:');
    
    if (!token) {
        console.log('❌ 无token，跳过API测试');
        return;
    }
    
    try {
        console.log('🔄 正在调用 /api/analytics/my-analytics...');
        
        const response = await fetch('http://localhost:8000/api/analytics/my-analytics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 响应状态:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API调用成功!');
            console.log('📈 返回数据:', data);
        } else {
            const errorText = await response.text();
            console.log('❌ API调用失败!');
            console.log('💬 错误详情:', errorText);
            
            if (response.status === 403) {
                console.log('🚨 403错误可能原因:');
                console.log('  - JWT token中的用户ID与后端不匹配');
                console.log('  - 用户权限验证失败');
                console.log('  - 角色权限不足');
            }
        }
    } catch (error) {
        console.log('❌ 网络错误:', error.message);
    }
}

// 4. 提供修复建议
function provideFix() {
    console.log('\n🔧 4. 修复建议:');
    console.log('如果仍然出现403错误:');
    console.log('1. 清除旧的认证数据: localStorage.clear()');
    console.log('2. 重新登录获取新的token');
    console.log('3. 确认用户ID在前后端一致');
    console.log('4. 检查后端API权限设置');
}

// 运行完整诊断
async function runFullDiagnosis() {
    const token = checkAuthStorage();
    const config = testAuthHeader(token);
    await testActualAPI(token);
    provideFix();
    console.log('\n✅ 诊断完成!');
}

// 执行诊断
runFullDiagnosis();

// 提供一些实用函数给用户
window.clearAuthData = function() {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    console.log('✅ 认证数据已清除，请重新登录');
};

window.checkAuth = checkAuthStorage;
window.testAPI = testActualAPI;

console.log('\n💡 实用命令:');
console.log('- clearAuthData(): 清除所有认证数据');
console.log('- checkAuth(): 检查当前认证状态');
console.log('- testAPI(token): 测试API调用');