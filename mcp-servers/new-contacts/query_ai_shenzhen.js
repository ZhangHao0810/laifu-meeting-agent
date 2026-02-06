import fs from 'fs';

// 读取数据
const employees = JSON.parse(fs.readFileSync('./data/employees.json', 'utf-8'));
const departments = JSON.parse(fs.readFileSync('./data/departments.json', 'utf-8'));

console.log('=== 查询 AI 部门 BASE 地在深圳的人员 ===\n');

// 步骤 1: 使用 getDepartmentInfo 获取 AI 部门信息
console.log('【步骤 1】查询 AI产品研发中心 部门信息...');
const aiDept = departments.find(dept => dept.ORG_NAME === 'AI产品研发中心');

if (!aiDept) {
    console.log('未找到 AI产品研发中心');
    process.exit(1);
}

console.log(`部门ID: ${aiDept.ORG_ID}`);
console.log(`部门成员数: ${aiDept.MEMBER_COUNT}`);
console.log(`成员工号数: ${aiDept.MEMBER_CODES.length}`);
console.log('');

// 步骤 2: 使用 getBatchUserInfo 批量查询成员信息（只查询需要的字段）
console.log('【步骤 2】批量查询成员信息（只获取 CODE, NAME, BASE_NAME 字段）...');
const memberCodes = aiDept.MEMBER_CODES;

// 模拟 getBatchUserInfo 工具
const foundEmployees = [];
const notFoundCodes = [];

memberCodes.forEach(code => {
    const employee = employees.find(emp => emp.CODE === code);
    if (employee) {
        // 只返回指定字段
        foundEmployees.push({
            CODE: employee.CODE,
            NAME: employee.NAME,
            BASE_NAME: employee.BASE_NAME,
            PHONE: employee.PHONE,
            EMAIL: employee.EMAIL
        });
    } else {
        notFoundCodes.push(code);
    }
});

console.log(`查询结果: 找到 ${foundEmployees.length} 个成员`);
if (notFoundCodes.length > 0) {
    console.log(`未找到: ${notFoundCodes.length} 个工号`);
}
console.log('');

// 步骤 3: 筛选 BASE 地在深圳的员工
console.log('【步骤 3】筛选 BASE 地在深圳的员工...');
const shenzhenEmployees = foundEmployees.filter(emp => emp.BASE_NAME === '深圳市');

console.log(`\n深圳员工数: ${shenzhenEmployees.length} 人\n`);
console.log('=== 深圳员工名单 ===\n');

shenzhenEmployees.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.NAME}`);
    console.log(`   工号: ${emp.CODE}`);
    console.log(`   电话: ${emp.PHONE}`);
    console.log(`   邮箱: ${emp.EMAIL}`);
    console.log('');
});

// 统计信息
console.log('=== 统计信息 ===');
console.log(`AI产品研发中心总人数: ${aiDept.MEMBER_COUNT}`);
console.log(`深圳员工人数: ${shenzhenEmployees.length}`);
console.log(`深圳员工占比: ${(shenzhenEmployees.length / aiDept.MEMBER_COUNT * 100).toFixed(1)}%`);

// 额外统计：所有 BASE 地分布
console.log('\n=== AI 部门 BASE 地分布 ===');
const baseDistribution = {};
foundEmployees.forEach(emp => {
    baseDistribution[emp.BASE_NAME] = (baseDistribution[emp.BASE_NAME] || 0) + 1;
});

const sortedBases = Object.entries(baseDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

sortedBases.forEach(([base, count]) => {
    const percentage = (count / foundEmployees.length * 100).toFixed(1);
    console.log(`${base}: ${count} 人 (${percentage}%)`);
});
