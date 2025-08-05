// 认证调试脚本 - 在浏览器控制台运行
console.log('=== 认证调试信息 ===');

// 检查localStorage中的认证数据
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  try {
    const parsedAuth = JSON.parse(authStorage);
    console.log('🔍 Auth Storage Content:', parsedAuth);
    
    // 检查token路径
    console.log('📝 Token paths:');
    console.log('  parsedAuth.state?.token:', parsedAuth.state?.token);
    console.log('  parsedAuth.token:', parsedAuth.token);
    
    // 检查用户信息
    console.log('👤 User paths:');
    console.log('  parsedAuth.state?.user:', parsedAuth.state?.user);
    console.log('  parsedAuth.user:', parsedAuth.user);
    
  } catch (error) {
    console.error('❌ Failed to parse auth storage:', error);
  }
} else {
  console.log('❌ No auth-storage found in localStorage');
}

// 检查所有localStorage键
console.log('🗂️ All localStorage keys:', Object.keys(localStorage));

// 检查旧的token存储方式
const oldToken = localStorage.getItem('token');
if (oldToken) {
  console.log('🔍 Old token found:', oldToken);
}