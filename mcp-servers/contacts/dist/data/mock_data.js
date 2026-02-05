import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, 'personal_profile.csv');
const fileContent = fs.readFileSync(csvPath, { encoding: 'utf-8' });
const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
});
export const EMPLOYEES = records.map((r) => ({
    user_id: r['工号'],
    name: r['姓名'],
    age: parseInt(r['年龄']),
    entry_date: r['入职日期'],
    is_classified: r['是否为涉密人员'] === '是',
    department: r['部门'],
    job_title: r['岗位'],
    job_level: r['职级'],
    location: r['办公地点'],
    manager_name: r['汇报人姓名'],
    email: r['邮箱'],
    mobile: r['联系电话'],
}));
const deptNames = Array.from(new Set(EMPLOYEES.map(e => e.department)));
export const DEPARTMENTS = deptNames.map(name => ({
    name,
    manager_name: "未知",
    sub_departments: [],
}));
//# sourceMappingURL=mock_data.js.map