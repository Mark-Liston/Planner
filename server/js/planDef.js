// planDef.js

"use strict";

class Plan
{
    student_id = "";
    student_name = "";
    degree_code = "";
    credit_points = 0;
    options = [];
    study_load = 0;
    completed_credit_points = 0;
    planned_credit_points = 0;
    completed_units = [];
    planned_units = [];
    schedule = [];
    message = "";
}

class Option
{
    type = "";
    items = [];
}

class OptionItem
{
    code = "";
    name = "";
    credit_points = 0;
}

class CompletedUnit
{
    code = "";
    name = "";
    credit_points = 0;
    grade = 0;
}

class Unit
{
    type = "";
    necessity = "";
    credit_points = 0;
    code = "";
    title = "";
    level = 0;
    semester = "";
    scheduled = false;
    notes = [];
    errors = [];
    prerequisites = [];
    exclusions = [];
}

class PrerequisiteNode
{
    operator = "";
    items = [];
}

class ShallowUnit
{
    code = "";
    name = "";
    credit_points = 0;
}

class Year
{
    year = 0;
    semesters = [];
}

class Semester
{
    semester = 0;
    credit_points = 0;
    units = [];
}

class UnitSelection
{
    type = "";
    necessity = "";
    credit_points = "";
    semester = "BOTH";
    scheduled = false;
    notes = [];
    errors = [];
    units = [];
}

module.exports =
{
    Plan: Plan,
    Option: Option,
    OptionItem: OptionItem,
    CompletedUnit: CompletedUnit,
    Unit: Unit,
    PrerequisiteNode: PrerequisiteNode,
    ShallowUnit: ShallowUnit,
    Year: Year,
    Semester: Semester,
    UnitSelection: UnitSelection
};
