export interface Employee {
    user_id: string;
    name: string;
    age: number;
    entry_date: string;
    is_classified: boolean;
    department: string;
    job_title: string;
    job_level: string;
    location: string;
    manager_name?: string;
    email: string;
    mobile: string;
}
export interface Department {
    name: string;
    manager_name: string;
    parent_department?: string;
    sub_departments: string[];
}
export declare const EMPLOYEES: Employee[];
export declare const DEPARTMENTS: Department[];
//# sourceMappingURL=mock_data.d.ts.map