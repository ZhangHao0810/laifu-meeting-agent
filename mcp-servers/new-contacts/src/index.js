#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load mock data
const employeesPath = path.join(__dirname, '../data/employees.json');
const departmentsPath = path.join(__dirname, '../data/departments.json');

let employees = [];
let departments = [];

try {
    employees = JSON.parse(fs.readFileSync(employeesPath, 'utf-8'));
    departments = JSON.parse(fs.readFileSync(departmentsPath, 'utf-8'));
    console.error(`Loaded ${employees.length} employees and ${departments.length} departments`);
} catch (error) {
    console.error('Error loading mock data:', error.message);
    console.error('Please run: npm run generate-data');
    process.exit(1);
}

// Helper function to filter employee fields
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

// Default fields for getDepartmentMembers to reduce context usage
const DEFAULT_MEMBER_FIELDS = ['CODE', 'NAME', 'BASE_NAME', 'PHONE', 'ORG_PATH_NAME'];
// Default fields for getAllDepartments to reduce context usage
const DEFAULT_DEPT_FIELDS = ['ORG_ID', 'ORG_NAME', 'ORG_CODE', 'ORG_PATH_NAME', 'PARENT_ORG_ID', 'ORG_LEVEL', 'ORG_TYPE', 'MANAGER_NAME', 'MEMBER_COUNT'];

// Create server instance
const server = new Server(
    {
        name: 'new-contacts',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'contacts_getCloudUserInfo',
                description: '根据人员 code（工号/员工编号）查询云端用户详细信息',
                inputSchema: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description: '员工编号 / 工号',
                        },
                    },
                    required: ['code'],
                },
            },
            {
                name: 'contacts_getDepartmentInfo',
                description: '根据部门 ID 或部门名称查询部门详细信息，包括部门基本信息、层级关系、部门内成员列表等',
                inputSchema: {
                    type: 'object',
                    properties: {
                        orgId: {
                            type: 'string',
                            description: '部门ID（与orgName二选一）',
                        },
                        orgName: {
                            type: 'string',
                            description: '部门名称（与orgId二选一）',
                        },
                    },
                },
            },
            {
                name: 'contacts_getUserByName',
                description: '根据员工姓名查询员工信息（主要用于获取工号、BASE地等）',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: '员工姓名（精确匹配）',
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'contacts_getBatchUserInfo',
                description: '批量查询多个员工的详细信息',
                inputSchema: {
                    type: 'object',
                    properties: {
                        codes: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '员工工号列表',
                        },
                        fields: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '需要返回的字段列表（可选，不传则返回全部字段）',
                        },
                    },
                    required: ['codes'],
                },
            },
            {
                name: 'contacts_searchUsersByName',
                description: '根据姓名关键词模糊搜索员工',
                inputSchema: {
                    type: 'object',
                    properties: {
                        keyword: {
                            type: 'string',
                            description: '搜索关键词（支持姓名、拼音）',
                        },
                        limit: {
                            type: 'number',
                            description: '返回结果数量限制（默认10，最大50）',
                        },
                    },
                    required: ['keyword'],
                },
            },
            {
                name: 'contacts_getDepartmentMembers',
                description: '查询部门成员信息，支持按 BASE 地过滤、字段选择等，适合 AI Agent 一次性获取精确结果',
                inputSchema: {
                    type: 'object',
                    properties: {
                        orgId: {
                            type: 'string',
                            description: '部门ID（与orgName二选一）',
                        },
                        orgName: {
                            type: 'string',
                            description: '部门名称（与orgName二选一）',
                        },
                        filters: {
                            type: 'object',
                            description: '过滤条件',
                            properties: {
                                baseNames: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                    },
                                    description: 'BASE 地过滤列表，例如 ["深圳市", "北京市"]',
                                },
                            },
                        },
                        fields: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '需要返回的字段列表，不传则返回默认字段 [CODE, NAME, BASE_NAME, PHONE, ORG_PATH_NAME]',
                        },
                        pagination: {
                            type: 'object',
                            description: '分页参数',
                            properties: {
                                page: {
                                    type: 'number',
                                    description: '页码，默认 1',
                                },
                                pageSize: {
                                    type: 'number',
                                    description: '每页数量，默认 20，最大 100',
                                },
                            },
                        },
                    },
                },
            },
            {
                name: 'contacts_getAllDepartments',
                description: '获取全量部门列表（扁平结构或树状结构），默认不返回成员列表以减少Token消耗',
                inputSchema: {
                    type: 'object',
                    properties: {
                        fields: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: '需要返回的字段列表，不传则返回默认字段 [ORG_ID, ORG_NAME, ORG_CODE, ORG_PATH_NAME, PARENT_ORG_ID, ORG_LEVEL, ORG_TYPE, MANAGER_NAME, MEMBER_COUNT]',
                        },
                        tree: {
                            type: 'boolean',
                            description: '是否返回树状结构（默认为 false，返回扁平列表）',
                        },
                    },
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === 'contacts_getCloudUserInfo') {
            const { code } = args;

            if (!code) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing required parameter: code',
                                records: 0,
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            const employee = employees.find(emp => emp.CODE === code);

            if (employee) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [employee],
                                message: 'Api access succeeded',
                                records: 1,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Employee not found',
                                records: 0,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            }
        } else if (name === 'contacts_getDepartmentInfo') {
            const { orgId, orgName } = args;

            if (!orgId && !orgName) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing required parameter: orgId or orgName',
                                records: 0,
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            let department;
            if (orgId) {
                department = departments.find(dept => dept.ORG_ID === orgId);
            } else {
                department = departments.find(dept => dept.ORG_NAME === orgName);
            }

            if (department) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [department],
                                message: 'Api access succeeded',
                                records: 1,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Department not found',
                                records: 0,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            }
        } else if (name === 'contacts_getUserByName') {
            const { name: userName } = args;

            if (!userName) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing required parameter: name',
                                records: 0,
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            const matchedEmployees = employees.filter(emp => emp.NAME === userName);

            if (matchedEmployees.length > 0) {
                const message = matchedEmployees.length > 1
                    ? 'Multiple employees found with the same name'
                    : 'Api access succeeded';

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: matchedEmployees,
                                message: message,
                                records: matchedEmployees.length,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Employee not found',
                                records: 0,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            }
        } else if (name === 'contacts_getBatchUserInfo') {
            const { codes, fields } = args;

            if (!codes || !Array.isArray(codes) || codes.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing or invalid parameter: codes (must be non-empty array)',
                                records: 0,
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            const foundEmployees = [];
            const notFoundCodes = [];

            codes.forEach(code => {
                const employee = employees.find(emp => emp.CODE === code);
                if (employee) {
                    foundEmployees.push(filterFields(employee, fields));
                } else {
                    notFoundCodes.push(code);
                }
            });

            const message = notFoundCodes.length > 0
                ? `Partial success: ${foundEmployees.length} found, ${notFoundCodes.length} not found`
                : 'Api access succeeded';

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            content: foundEmployees,
                            notFound: notFoundCodes,
                            message: message,
                            records: foundEmployees.length,
                            successFlag: true,
                        }, null, 2),
                    },
                ],
            };
        } else if (name === 'contacts_searchUsersByName') {
            const { keyword, limit } = args;

            if (!keyword) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing required parameter: keyword',
                                records: 0,
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            // Search in NAME and PINYIN fields
            const matchedEmployees = employees.filter(emp =>
                emp.NAME.includes(keyword) || emp.PINYIN.includes(keyword)
            );

            // Apply limit (default 10, max 50)
            const resultLimit = Math.min(limit || 10, 50);
            const limitedResults = matchedEmployees.slice(0, resultLimit);

            // Return basic fields for search results
            const searchResults = limitedResults.map(emp => ({
                CODE: emp.CODE,
                NAME: emp.NAME,
                PINYIN: emp.PINYIN,
                ORG_PATH_NAME: emp.ORG_PATH_NAME,
                BASE_NAME: emp.BASE_NAME,
            }));

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            content: searchResults,
                            message: 'Search completed',
                            records: searchResults.length,
                            totalMatches: matchedEmployees.length,
                            successFlag: true,
                        }, null, 2),
                    },
                ],
            };
        } else if (name === 'contacts_getDepartmentMembers') {
            const { orgId, orgName, filters, fields, pagination } = args;

            // Validate input
            if (!orgId && !orgName) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Missing required parameter: orgId or orgName',
                                successFlag: false,
                            }, null, 2),
                        },
                    ],
                };
            }

            // Step 1: Find department
            let department;
            if (orgId) {
                department = departments.find(dept => dept.ORG_ID === orgId);
            } else {
                department = departments.find(dept => dept.ORG_NAME === orgName);
            }

            if (!department) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: [],
                                message: 'Department not found',
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
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
            if (filters?.baseNames && Array.isArray(filters.baseNames) && filters.baseNames.length > 0) {
                members = members.filter(emp => filters.baseNames.includes(emp.BASE_NAME));
            }

            const totalMatches = members.length;

            // Step 4: Apply field selection
            const selectedFields = fields || DEFAULT_MEMBER_FIELDS;
            members = members.map(emp => filterFields(emp, selectedFields));

            // Step 5: Apply pagination
            const page = pagination?.page || 1;
            const pageSize = Math.min(pagination?.pageSize || 20, 100);
            const startIndex = (page - 1) * pageSize;
            const paginatedMembers = members.slice(startIndex, startIndex + pageSize);

            // Step 6: Build response
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            content: paginatedMembers,
                            department: {
                                ORG_ID: department.ORG_ID,
                                ORG_NAME: department.ORG_NAME,
                                MEMBER_COUNT: department.MEMBER_COUNT,
                            },
                            filtered: {
                                totalMatches: totalMatches,
                                returned: paginatedMembers.length,
                            },
                            message: 'Api access succeeded',
                            successFlag: true,
                        }, null, 2),
                    },
                ],
            };
        } else if (name === 'contacts_getAllDepartments') {
            const { fields, tree } = args;

            // Helper to filter department fields
            function filterDepartment(dept) {
                const selectedFields = fields || DEFAULT_DEPT_FIELDS;
                const filtered = {};
                selectedFields.forEach(field => {
                    if (dept.hasOwnProperty(field)) {
                        filtered[field] = dept[field];
                    }
                });
                return filtered;
            }

            // Get filtered list
            const filteredDepts = departments.map(d => filterDepartment(d));

            // Build tree if requested
            if (tree) {
                const deptMap = new Map();
                const roots = [];

                // Create nodes
                filteredDepts.forEach(dept => {
                    dept.children = [];
                    deptMap.set(dept.ORG_ID, dept);
                });

                // Build hierarchy
                filteredDepts.forEach(dept => {
                    if (dept.PARENT_ORG_ID && deptMap.has(dept.PARENT_ORG_ID)) {
                        const parent = deptMap.get(dept.PARENT_ORG_ID);
                        parent.children.push(dept);
                    } else {
                        roots.push(dept);
                    }
                });

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: roots,
                                message: 'Api access succeeded (Tree Structure)',
                                totalCount: departments.length,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            } else {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                content: filteredDepts,
                                message: 'Api access succeeded (Flat List)',
                                totalCount: filteredDepts.length,
                                successFlag: true,
                            }, null, 2),
                        },
                    ],
                };
            }
        } else {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: `Unknown tool: ${name}`,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    } catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: error.message,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('New Contacts MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
