import fs from 'fs';

// 读取数据
const employees = JSON.parse(fs.readFileSync('./data/employees.json', 'utf-8'));
const departments = JSON.parse(fs.readFileSync('./data/departments.json', 'utf-8'));

// 辅助函数
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

const DEFAULT_MEMBER_FIELDS = ['CODE', 'NAME', 'BASE_NAME', 'PHONE', 'ORG_PATH_NAME'];

console.log('=== 测试 getDepartmentMembers 工具 ===\n');

// 测试 1: AI 部门 + 深圳过滤（您的需求场景）
console.log('【测试 1】查询 AI 部门深圳员工（使用默认字段）');
const test1Args = {
    orgName: 'AI产品研发中心',
    filters: {
        baseNames: ['深圳市']
    }
};

// 模拟工具逻辑
const dept1 = departments.find(d => d.ORG_NAME === test1Args.orgName);
let members1 = [];
dept1.MEMBER_CODES.forEach(code => {
    const emp = employees.find(e => e.CODE === code);
    if (emp) members1.push(emp);
});

// 应用过滤
if (test1Args.filters?.baseNames) {
    members1 = members1.filter(emp => test1Args.filters.baseNames.includes(emp.BASE_NAME));
}

// 应用字段选择（使用默认字段）
const totalMatches1 = members1.length;
members1 = members1.map(emp => filterFields(emp, DEFAULT_MEMBER_FIELDS));

console.log(`部门: ${dept1.ORG_NAME}`);
console.log(`部门总人数: ${dept1.MEMBER_COUNT}`);
console.log(`符合条件: ${totalMatches1} 人`);
console.log(`返回字段: ${Object.keys(members1[0]).join(', ')}`);
console.log('\n深圳员工:');
members1.forEach((emp, i) => {
    console.log(`  ${i + 1}. ${emp.NAME} (${emp.CODE}) - ${emp.PHONE}`);
});
console.log('');

// 测试 2: 多城市过滤
console.log('【测试 2】查询 AI 部门多个城市员工（深圳、北京、上海）');
const test2Args = {
    orgName: 'AI产品研发中心',
    filters: {
        baseNames: ['深圳市', '北京市', '上海市']
    },
    fields: ['CODE', 'NAME', 'BASE_NAME']
};

const dept2 = departments.find(d => d.ORG_NAME === test2Args.orgName);
let members2 = [];
dept2.MEMBER_CODES.forEach(code => {
    const emp = employees.find(e => e.CODE === code);
    if (emp) members2.push(emp);
});

if (test2Args.filters?.baseNames) {
    members2 = members2.filter(emp => test2Args.filters.baseNames.includes(emp.BASE_NAME));
}

const totalMatches2 = members2.length;
members2 = members2.map(emp => filterFields(emp, test2Args.fields));

console.log(`符合条件: ${totalMatches2} 人`);
console.log(`返回字段: ${Object.keys(members2[0]).join(', ')}`);
console.log('\nBASE 地分布:');
const distribution = {};
members2.forEach(emp => {
    distribution[emp.BASE_NAME] = (distribution[emp.BASE_NAME] || 0) + 1;
});
Object.entries(distribution).forEach(([base, count]) => {
    console.log(`  ${base}: ${count} 人`);
});
console.log('');

// 测试 3: 无过滤条件（返回全部，使用分页）
console.log('【测试 3】查询 AI 部门全部成员（分页：第1页，每页10人）');
const test3Args = {
    orgName: 'AI产品研发中心',
    fields: ['CODE', 'NAME'],
    pagination: {
        page: 1,
        pageSize: 10
    }
};

const dept3 = departments.find(d => d.ORG_NAME === test3Args.orgName);
let members3 = [];
dept3.MEMBER_CODES.forEach(code => {
    const emp = employees.find(e => e.CODE === code);
    if (emp) members3.push(emp);
});

const totalMatches3 = members3.length;
members3 = members3.map(emp => filterFields(emp, test3Args.fields));

// 分页
const page = test3Args.pagination.page || 1;
const pageSize = test3Args.pagination.pageSize || 20;
const startIndex = (page - 1) * pageSize;
const paginatedMembers = members3.slice(startIndex, startIndex + pageSize);

console.log(`总人数: ${totalMatches3}`);
console.log(`返回: 第${page}页，${paginatedMembers.length} 人`);
console.log('\n第1页成员:');
paginatedMembers.forEach((emp, i) => {
    console.log(`  ${i + 1}. ${emp.NAME} (${emp.CODE})`);
});
console.log('');

// 测试 4: 对比数据量
console.log('【测试 4】数据量对比');
console.log('\n旧方案（getDepartmentInfo + getBatchUserInfo）:');
console.log(`  - 调用次数: 2 次`);
console.log(`  - 返回数据: ${dept1.MEMBER_COUNT} 个完整员工对象`);
const oldSize = JSON.stringify(employees.slice(0, dept1.MEMBER_COUNT)).length;
console.log(`  - 数据大小: ~${Math.round(oldSize / 1024)} KB`);

console.log('\n新方案（getDepartmentMembers）:');
console.log(`  - 调用次数: 1 次`);
console.log(`  - 返回数据: ${totalMatches1} 个精简员工对象`);
const newSize = JSON.stringify(members1).length;
console.log(`  - 数据大小: ~${Math.round(newSize / 1024)} KB`);
console.log(`  - 减少: ${Math.round((1 - newSize / oldSize) * 100)}%`);

console.log('\n=== 所有测试完成 ===');
