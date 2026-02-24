import fs from 'fs';

// 读取员工数据
const employees = JSON.parse(fs.readFileSync('./data/employees.json', 'utf-8'));

// 要查询的员工姓名列表
const names = ['王星', '郑纯桂英', '郭露亮', '孙薇洁', '陶亮虹', '夏露', '唐涛', '段健'];

console.log('=== 员工BASE地查询结果 ===\n');

names.forEach(name => {
    const emp = employees.find(e => e.NAME === name);
    if (emp) {
        console.log(`姓名: ${emp.NAME}`);
        console.log(`工号: ${emp.CODE}`);
        console.log(`BASE地: ${emp.BASE_NAME}`);
        console.log(`部门: ${emp.ORG_PATH_NAME}`);
        console.log(`电话: ${emp.PHONE}`);
        console.log('---');
    } else {
        console.log(`${name} - 未找到`);
        console.log('---');
    }
});

