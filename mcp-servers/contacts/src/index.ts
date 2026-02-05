#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EMPLOYEES, DEPARTMENTS } from "./data/mock_data.js";

/**
 * Contacts Service MCP Server
 * Strictly aligned with L-Skill 2.0 definitions.
 */

const server = new McpServer({
    name: "contacts-service",
    version: "1.0.0",
});

// --- Contacts Tools ---

server.registerTool(
    "contacts_search",
    {
        title: "Search Contacts",
        description: "在企业通讯录中检索人员。支持关键字、部门、职级、地点组合筛选。",
        inputSchema: z.object({
            keyword: z.string().optional().describe("支持姓名、工号、邮箱、联系电话模糊查询"),
            department: z.string().optional().describe("所属部门"),
            job_level: z.string().optional().describe("职级 (如 P7, P7+)"),
            location: z.string().optional().describe("办公城市"),
        }),
    },
    async (params) => {
        let results = EMPLOYEES;

        if (params.keyword) {
            const kw = params.keyword.toLowerCase();
            results = results.filter(e =>
                e.name.toLowerCase().includes(kw) ||
                e.user_id.toLowerCase().includes(kw) ||
                e.email.toLowerCase().includes(kw) ||
                e.mobile.includes(kw)
            );
        }
        if (params.department) {
            results = results.filter(e => e.department === params.department);
        }
        if (params.location) {
            results = results.filter(e => e.location === params.location);
        }
        if (params.job_level) {
            const levelMatch = params.job_level.match(/P(\d+)(\+)?/);
            if (levelMatch) {
                const levelNum = parseInt(levelMatch[1]);
                const isPlus = levelMatch[2] === "+";
                results = results.filter((e) => {
                    const eLevelNum = parseInt(e.job_level.replace('P', ''));
                    return isPlus ? eLevelNum >= levelNum : eLevelNum === levelNum;
                });
            } else {
                results = results.filter(e => e.job_level === params.job_level);
            }
        }

        return {
            content: [{ type: "text", text: `Found ${results.length} contacts.` }],
            structuredContent: { total: results.length, user_list: results.map(e => ({ ...e })) }
        };
    }
);

server.registerTool(
    "contacts_get_detail",
    {
        title: "Get Contact Detail",
        description: "获取单个联系人的完整档案（含联系方式）。",
        inputSchema: z.object({
            target_user_id: z.string().describe("员工工号"),
        }),
    },
    async ({ target_user_id }) => {
        const employee = EMPLOYEES.find(e => e.user_id === target_user_id);
        if (!employee) {
            return {
                content: [{ type: "text", text: `Contact with ID ${target_user_id} not found.` }],
                isError: true
            };
        }
        return {
            content: [{ type: "text", text: `Detail for ${employee.name} (${employee.user_id})` }],
            structuredContent: { ...employee } as Record<string, any>
        };
    }
);

server.registerTool(
    "contacts_get_metadata_options",
    {
        title: "Get Metadata Options",
        description: "获取系统合法的常量标准（职级、城市、部门列表）。",
        inputSchema: z.object({
            type: z.enum(["job_level", "location", "department"]),
        }),
    },
    async ({ type }) => {
        let options: string[] = [];
        if (type === "job_level") {
            options = Array.from(new Set(EMPLOYEES.map(e => e.job_level))).sort();
        } else if (type === "location") {
            options = Array.from(new Set(EMPLOYEES.map(e => e.location))).sort();
        } else {
            options = Array.from(new Set(EMPLOYEES.map(e => e.department))).sort();
        }
        return {
            content: [{ type: "text", text: `Available ${type} options: ${options.join(", ")}` }],
            structuredContent: { options }
        };
    }
);

// --- Organization Tools ---

server.registerTool(
    "contacts_search_departments",
    {
        title: "Search Departments",
        description: "搜索公司内部的部门或组织单元。",
        inputSchema: z.object({
            keyword: z.string().describe("部门关键字"),
        }),
    },
    async ({ keyword }) => {
        const kw = keyword.toLowerCase();
        const results = DEPARTMENTS.filter(d => d.name.toLowerCase().includes(kw));
        return {
            content: [{ type: "text", text: `Found ${results.length} departments matching '${keyword}'.` }],
            structuredContent: { total: results.length, departments: results }
        };
    }
);

server.registerTool(
    "contacts_get_department_detail",
    {
        title: "Get Department Detail",
        description: "查看部门的详细结构信息（含负责人、层级）。",
        inputSchema: z.object({
            department_name: z.string().describe("部门名称"),
        }),
    },
    async ({ department_name }) => {
        const dept = DEPARTMENTS.find(d => d.name === department_name);
        if (!dept) {
            return {
                content: [{ type: "text", text: `Department '${department_name}' not found.` }],
                isError: true
            };
        }
        return {
            content: [{ type: "text", text: `Details for department: ${dept.name}` }],
            structuredContent: { ...dept } as Record<string, any>
        };
    }
);

server.registerTool(
    "contacts_get_org_hierarchy",
    {
        title: "Get Org Hierarchy",
        description: "查询企业行政汇报关系的路径。",
        inputSchema: z.object({
            target_user_id: z.string().describe("目标工号"),
            direction: z.enum(["up", "down"]).default("up").describe("查询方向"),
        }),
    },
    async ({ target_user_id, direction }) => {
        const report_line: any[] = [];
        if (direction === "up") {
            let currentEmp = EMPLOYEES.find(e => e.user_id === target_user_id);
            while (currentEmp) {
                report_line.push({
                    user_id: currentEmp.user_id,
                    name: currentEmp.name,
                    job_title: currentEmp.job_title,
                    job_level: currentEmp.job_level
                });

                const managerName = currentEmp.manager_name;
                if (!managerName || managerName === "None" || managerName === "无") break;

                const managerEmp = EMPLOYEES.find(e => e.name === managerName);
                if (!managerEmp || managerEmp.user_id === currentEmp.user_id) break;

                currentEmp = managerEmp;
                if (report_line.length > 15) break;
            }
        } else {
            const targetEmp = EMPLOYEES.find(e => e.user_id === target_user_id);
            if (targetEmp) {
                const subordinates = EMPLOYEES.filter(e => e.manager_name === targetEmp.name);
                report_line.push(...subordinates.map(e => ({
                    user_id: e.user_id,
                    name: e.name,
                    job_title: e.job_title,
                    job_level: e.job_level
                })));
            }
        }

        return {
            content: [{ type: "text", text: `Found ${report_line.length} nodes in hierarchy.` }],
            structuredContent: { report_line }
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Contacts Service MCP server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
