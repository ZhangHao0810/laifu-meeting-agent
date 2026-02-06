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

console.log('=== 使用 getDepartmentMembers 查询 AI 部门青岛员工 ===\n');

// 模拟 MCP 工具调用
const args = {
    orgName: 'AI产品研发中心',
    filters: {
        baseNames: ['青岛市']
    },
    fields: ['CODE', 'NAME', 'PHONE', 'EMAIL', 'BASE_NAME']
};

console.log('【工具调用】getDepartmentMembers');
console.log('参数:', JSON.stringify(args, null, 2));
console.log('');

// 执行查询逻辑
// Step 1: Find department
const department = departments.find(dept => dept.ORG_NAME === args.orgName);

if (!department) {
    console.log('未找到部门');
    process.exit(1);
}

// Step 2: Get all members
let members = [];
department.MEMBER_CODES.forEach(code => {
    const employee = employees.find(emp => emp.CODE === code);
    if (employee) {
        members.push(employee);
    }
});

// Step 3: Apply filters
if (args.filters?.baseNames) {
    members = members.filter(emp => args.filters.baseNames.includes(emp.BASE_NAME));
}

const totalMatches = members.length;

// Step 4: Apply field selection
const selectedFields = args.fields || DEFAULT_MEMBER_FIELDS;
members = members.map(emp => filterFields(emp, selectedFields));

// 构建响应
const response = {
    content: members,
    department: {
        ORG_ID: department.ORG_ID,
        ORG_NAME: department.ORG_NAME,
        MEMBER_COUNT: department.MEMBER_COUNT,
    },
    filtered: {
        totalMatches: totalMatches,
        returned: members.length,
    },
    message: 'Api access succeeded',
    successFlag: true,
};

console.log('【查询结果】\n');
console.log(`部门: ${response.department.ORG_NAME}`);
console.log(`部门总人数: ${response.department.MEMBER_COUNT}`);
console.log(`符合条件: ${response.filtered.totalMatches} 人`);
console.log(`返回数据: ${response.filtered.returned} 人\n`);

console.log('=== 青岛市员工名单 ===\n');
response.content.forEach((emp, index) => {
    console.log(`${index + 1}. ${emp.NAME}`);
    console.log(`   工号: ${emp.CODE}`);
    console.log(`   电话: ${emp.PHONE}`);
    console.log(`   邮箱: ${emp.EMAIL}`);
    console.log(`   BASE地: ${emp.BASE_NAME}`);
    console.log('');
});

console.log('=== 统计信息 ===');
console.log(`青岛员工占比: ${(totalMatches / department.MEMBER_COUNT * 100).toFixed(1)}%`);
console.log(`数据大小: ~${Math.round(JSON.stringify(response.content).length / 1024)} KB`);
