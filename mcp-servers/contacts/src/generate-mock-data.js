import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chinese surnames and given names for realistic data
const surnames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '吴', '周', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾', '肖', '田', '董', '袁', '潘', '于', '蒋', '蔡', '余', '杜', '叶', '程', '苏', '魏', '吕', '丁', '任', '沈', '姚', '卢', '姜', '崔', '钟', '谭', '陆', '汪', '范', '金', '石', '廖', '贾', '夏', '韦', '付', '方', '白', '邹', '孟', '熊', '秦', '邱', '江', '尹', '薛', '闫', '段', '雷', '侯', '龙', '史', '陶', '黎', '贺', '顾', '毛', '郝', '龚', '邵', '万', '钱', '严', '覃', '武', '戴', '莫', '孔', '向'];
const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '华', '建华', '文', '辉', '力', '鹏', '帆', '宇', '浩', '凯', '俊', '波', '斌', '欢', '婷', '雪', '梅', '莉', '燕', '红', '玲', '慧', '琳', '颖', '萍', '佳', '薇', '倩', '瑶', '晨', '阳', '宁', '健', '峰', '亮', '飞', '鑫', '晶', '蕾', '娟', '琴', '云', '兰', '英', '菊', '月', '春', '秋', '冬', '夏', '晓', '雨', '雪', '冰', '霜', '露', '风', '雷', '电', '虹', '星', '月', '日', '光', '辉', '煌', '耀', '灿', '烂', '璀', '璨', '闪', '亮', '明', '朗', '清', '澈', '纯', '洁'];

// Pinyin mapping for common Chinese characters
const pinyinMap = {
    '王': 'wang', '李': 'li', '张': 'zhang', '刘': 'liu', '陈': 'chen', '杨': 'yang', '黄': 'huang', '赵': 'zhao', '吴': 'wu', '周': 'zhou',
    '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu', '郭': 'guo', '何': 'he', '高': 'gao', '林': 'lin', '罗': 'luo',
    '郑': 'zheng', '梁': 'liang', '谢': 'xie', '宋': 'song', '唐': 'tang', '许': 'xu', '韩': 'han', '冯': 'feng', '邓': 'deng', '曹': 'cao',
    '彭': 'peng', '曾': 'zeng', '肖': 'xiao', '田': 'tian', '董': 'dong', '袁': 'yuan', '潘': 'pan', '于': 'yu', '蒋': 'jiang', '蔡': 'cai',
    '伟': 'wei', '芳': 'fang', '娜': 'na', '敏': 'min', '静': 'jing', '丽': 'li', '强': 'qiang', '磊': 'lei', '军': 'jun', '洋': 'yang',
    '勇': 'yong', '艳': 'yan', '杰': 'jie', '涛': 'tao', '明': 'ming', '超': 'chao', '华': 'hua', '文': 'wen', '辉': 'hui', '力': 'li',
    '鹏': 'peng', '帆': 'fan', '宇': 'yu', '浩': 'hao', '凯': 'kai', '俊': 'jun', '波': 'bo', '斌': 'bin', '欢': 'huan', '婷': 'ting',
    '雪': 'xue', '梅': 'mei', '莉': 'li', '燕': 'yan', '红': 'hong', '玲': 'ling', '慧': 'hui', '琳': 'lin', '颖': 'ying', '萍': 'ping',
    '佳': 'jia', '薇': 'wei', '倩': 'qian', '瑶': 'yao', '晨': 'chen', '阳': 'yang', '宁': 'ning', '健': 'jian', '峰': 'feng', '亮': 'liang',
    '飞': 'fei', '鑫': 'xin', '晶': 'jing', '蕾': 'lei', '娟': 'juan', '琴': 'qin', '云': 'yun', '兰': 'lan', '英': 'ying', '菊': 'ju',
    '秀': 'xiu', '建': 'jian', '刚': 'gang', '桂': 'gui', '霞': 'xia', '平': 'ping', '月': 'yue', '春': 'chun', '秋': 'qiu', '冬': 'dong', '夏': 'xia', '晓': 'xiao', '雨': 'yu'
};

// Cities for BASE_NAME
const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市', '西安市', '济南市', '青岛市', '郑州市', '长沙市', '重庆市', '天津市', '苏州市', '厦门市', '宁波市', '合肥市', '福州市'];

// Education levels
const educationLevels = ['本科', '硕士研究生', '博士研究生', '大专'];

// Generate pinyin from Chinese name
function generatePinyin(name) {
    let pinyin = '';
    for (let char of name) {
        pinyin += pinyinMap[char] || char.toLowerCase();
    }
    return pinyin;
}

// Generate random Chinese name
function generateName() {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName1 = givenNames[Math.floor(Math.random() * givenNames.length)];
    const givenName2 = Math.random() > 0.5 ? givenNames[Math.floor(Math.random() * givenNames.length)] : '';
    return surname + givenName1 + givenName2;
}

// Generate random phone number
function generatePhone() {
    const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + suffix;
}

// Generate random ID number
function generateIdNum() {
    const areaCode = ['110', '310', '440', '330', '320', '510', '420', '610', '370', '410'];
    const area = areaCode[Math.floor(Math.random() * areaCode.length)];
    const year = 1970 + Math.floor(Math.random() * 30);
    const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
    const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return area + '101' + year + month + day + suffix;
}

// Generate random birth date
function generateBirth() {
    const year = 1970 + Math.floor(Math.random() * 30);
    const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
    const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate IM_OPEN_ID
function generateOpenId() {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 24; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// Load department structure
const orgStructure = JSON.parse(fs.readFileSync(path.join(__dirname, '../../部分组织架构.json'), 'utf-8'));

// Flatten department structure and assign IDs
function flattenDepartments(node, parentPath = '', parentId = null, departments = [], level = 0) {
    const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
    const orgId = Date.now().toString() + Math.floor(Math.random() * 1000000).toString();

    const dept = {
        ORG_ID: orgId,
        ORG_NAME: node.name,
        ORG_CODE: `DEPT_${orgId.slice(-6)}`,
        ORG_PATH_NAME: currentPath,
        PARENT_ORG_ID: parentId,
        PARENT_ORG_NAME: parentPath.split('\\').pop() || null,
        ORG_LEVEL: level.toString(),
        ORG_TYPE: level <= 1 ? 'COMPANY' : 'DEPT',
        MANAGER_CODE: null,
        MANAGER_NAME: null,
        MANAGER_IM_OPEN_ID: null,
        MEMBER_COUNT: 0,
        MEMBER_IDS: [],
        MEMBER_CODES: [],
        MEMBER_NAMES: [],
        CREATE_TIME: '2020-01-15 09:00:00',
        M_LAST_MODIFIED_AT: '2026-01-20 14:30:00',
        IS_ENABLE: '1',
        SORT_ORDER: departments.length.toString()
    };

    departments.push(dept);

    if (node.children && node.children.length > 0) {
        for (const child of node.children) {
            flattenDepartments(child, currentPath, orgId, departments, level + 1);
        }
    }

    return departments;
}

const departments = flattenDepartments(orgStructure);

// Filter leaf departments (departments with no children) for employee assignment
const leafDepartments = departments.filter(dept => {
    return !departments.some(d => d.PARENT_ORG_ID === dept.ORG_ID);
});

console.log(`Total departments: ${departments.length}`);
console.log(`Leaf departments: ${leafDepartments.length}`);

// Generate employees
const employees = [];
const targetEmployeeCount = 2000;
const employeesPerDept = Math.ceil(targetEmployeeCount / leafDepartments.length);

let employeeCode = 10001;

for (const dept of leafDepartments) {
    const numEmployees = Math.floor(employeesPerDept * (0.8 + Math.random() * 0.4)); // Vary by ±20%

    for (let i = 0; i < numEmployees && employees.length < targetEmployeeCount; i++) {
        const name = generateName();
        const pinyin = generatePinyin(name);
        const openId = generateOpenId();
        const code = employeeCode.toString();

        const employee = {
            CODE: code,
            NAME: name,
            PINYIN: pinyin,
            SEX_NAME: Math.random() > 0.5 ? '男' : '女',
            BIRTH: generateBirth(),
            ID_NUM: generateIdNum(),
            NATION_NAME: '汉族',
            NATION: '01',
            EMAIL: `${pinyin}@zhongfu.net`,
            PHONE: generatePhone(),
            ORG_PATH_NAME: dept.ORG_PATH_NAME,
            BASE_NAME: cities[Math.floor(Math.random() * cities.length)],
            ATTEND_ADDRESS: '370100',
            CURRENT_RESIDENCE: null,
            REGISTERED_RESIDENCE_NAME: null,
            EDU_TALLEST_NAME: educationLevels[Math.floor(Math.random() * educationLevels.length)],
            BANK_CORR_NUM: Math.floor(Math.random() * 100000000000).toString(),
            CREATE_TIME: '2020-01-15 09:00:00',
            M_LAST_MODIFIED_AT: '2026-01-23 10:33:23',
            M_LAST_MODIFIED_BY: 'admin',
            IS_ENABLE: '1',
            EMP_STATUS: '001',
            POLITICS_STATUS: '01',
            M_SECURITY_LEVEL: '1',
            IM_OPEN_ID: openId,
            ORG_ID: dept.ORG_ID,
            M_DATA_VERSION: Math.floor(Math.random() * 500).toString(),
            M_DATA_STATE: '0',
            M_IS_FROM: 'mdm::manual',
            M_CREATED_BY: 'admin',
            M_CREATED_DEPT: null,
            MENTOR: null,
            PAYROLL_DATE: null,
            PARTICIPATE_IN_DATE: '2020-06-30',
            EDU_ONE: '003',
            SORT: '002',
            ORG_CODE: dept.ORG_CODE,
            JID: Math.floor(Math.random() * 20000).toString(),
            M_MODEL_ID: generateOpenId()
        };

        employees.push(employee);

        // Add to department member lists
        dept.MEMBER_IDS.push(openId);
        dept.MEMBER_CODES.push(code);
        dept.MEMBER_NAMES.push(name);
        dept.MEMBER_COUNT++;

        // Assign first employee as manager
        if (i === 0) {
            dept.MANAGER_CODE = code;
            dept.MANAGER_NAME = name;
            dept.MANAGER_IM_OPEN_ID = openId;
        }

        employeeCode++;
    }
}

console.log(`Generated ${employees.length} employees`);

// Save to files
const dataDir = path.join(__dirname, '../data');
fs.writeFileSync(path.join(dataDir, 'employees.json'), JSON.stringify(employees, null, 2));
fs.writeFileSync(path.join(dataDir, 'departments.json'), JSON.stringify(departments, null, 2));

console.log('Mock data generated successfully!');
console.log(`- Employees: ${employees.length}`);
console.log(`- Departments: ${departments.length}`);
console.log(`Files saved to ${dataDir}`);
