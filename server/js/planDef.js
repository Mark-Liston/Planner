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
}

class Option
{
}

class OptionItem
{
}

class CompletedUnit
{
}

class Unit
{
    type = "";
    necessity = "";
    credit_points = 0;
    code = "";
    title = "";
    enrolment_mode = "";
    semester = "";
    notes = [];
    errors = [];
    prerequisites = [];
    exclusions = [];
}

class ShallowUnit
{
    code = "";
    name = "";
    credit_points = 0;
}

class Year
{
}

class Semester
{
}

class UnitSelection
{
    type = "";
    necessity = "";
    credit_points = "";
    semester = "both";
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
    ShallowUnit: ShallowUnit,
    Year: Year,
    Semester: Semester,
    UnitSelection: UnitSelection
};
