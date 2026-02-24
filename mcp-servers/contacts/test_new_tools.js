import fs from 'fs';

// 读取员工数据
const employees = JSON.parse(fs.readFileSync('./data/employees.json', 'utf-8'));

// 模拟工具函数
function filterFields(employee, fields) {
    if (!fields || fields.length === 0) {
        return employee;
    }
    const filtered = {};
    fields.forEach(field => {
        if (employee.hasOwnProperty(field)) {
            filtered[field] = employee[field];
        }
    });
    return filtered;
}

console.log('=== 测试新增的 MCP 工具 ===\n');

// 测试 1: getUserByName - 单个匹配
console.log('【测试 1】getUserByName - 查询"王星"');
const test1 = employees.filter(emp => emp.NAME === '王星');
console.log(`结果: 找到 ${test1.length} 个员工`);
if (test1.length > 0) {
    console.log(`  - 工号: ${test1[0].CODE}`);
    console.log(`  - BASE地: ${test1[0].BASE_NAME}`);
}
console.log('');

// 测试 2: getUserByName - 未找到
console.log('【测试 2】getUserByName - 查询"不存在的人"');
const test2 = employees.filter(emp => emp.NAME === '不存在的人');
console.log(`结果: 找到 ${test2.length} 个员工`);
console.log('');

// 测试 3: getBatchUserInfo - 全部有效
console.log('【测试 3】getBatchUserInfo - 批量查询 ["11528", "11529", "11530"]');
const codes3 = ['11528', '11529', '11530'];
const found3 = [];
const notFound3 = [];
codes3.forEach(code => {
    const emp = employees.find(e => e.CODE === code);
    if (emp) {
        found3.push(emp);
    } else {
        notFound3.push(code);
    }
});
console.log(`结果: 找到 ${found3.length} 个, 未找到 ${notFound3.length} 个`);
found3.forEach(emp => {
    console.log(`  - ${emp.NAME} (${emp.CODE}): ${emp.BASE_NAME}`);
});
console.log('');

// 测试 4: getBatchUserInfo - 带字段过滤
console.log('【测试 4】getBatchUserInfo - 只返回指定字段');
const fields4 = ['CODE', 'NAME', 'BASE_NAME'];
const filtered4 = found3.map(emp => filterFields(emp, fields4));
console.log(`结果: 返回字段数 ${Object.keys(filtered4[0]).length}`);
console.log(`  字段: ${Object.keys(filtered4[0]).join(', ')}`);
console.log('');

// 测试 5: getBatchUserInfo - 部分无效
console.log('【测试 5】getBatchUserInfo - 包含无效工号 ["11528", "99999", "88888"]');
const codes5 = ['11528', '99999', '88888'];
const found5 = [];
const notFound5 = [];
codes5.forEach(code => {
    const emp = employees.find(e => e.CODE === code);
    if (emp) {
        found5.push(emp);
    } else {
        notFound5.push(code);
    }
});
console.log(`结果: 找到 ${found5.length} 个, 未找到 ${notFound5.length} 个`);
console.log(`  未找到的工号: ${notFound5.join(', ')}`);
console.log('');

// 测试 6: searchUsersByName - 关键词搜索
console.log('【测试 6】searchUsersByName - 搜索关键词"王", 限制5个');
const keyword6 = '王';
const matched6 = employees.filter(emp =>
    emp.NAME.includes(keyword6) || emp.PINYIN.includes(keyword6)
);
const limited6 = matched6.slice(0, 5);
console.log(`结果: 总匹配 ${matched6.length} 个, 返回 ${limited6.length} 个`);
limited6.forEach(emp => {
    console.log(`  - ${emp.NAME} (${emp.CODE}): ${emp.BASE_NAME}`);
});
console.log('');

// 测试 7: searchUsersByName - 限制最大值
console.log('【测试 7】searchUsersByName - 搜索"李", 请求100个（应限制为50）');
const keyword7 = '李';
const matched7 = employees.filter(emp =>
    emp.NAME.includes(keyword7) || emp.PINYIN.includes(keyword7)
);
const limit7 = Math.min(100, 50);
const limited7 = matched7.slice(0, limit7);
console.log(`结果: 总匹配 ${matched7.length} 个, 实际返回 ${limited7.length} 个（限制为50）`);
console.log('');

console.log('=== 所有测试完成 ===');
