# Taste It — Project Overview

## 1. Project Identity

**Project:** Taste It – AI-Assisted Inventory and Sales Management System

**Organization:** Taste It Café

**Type:** Client-based academic system-development project

**Platform:** Web-based application

**Branches:**

- Babag
- Marigondon

**Primary users:**

- Owner / Manager
- Staff

---

## 2. Business Context

Taste It Café is a budget-friendly food-service/café business in Lapu-Lapu City.

The café sells products including:

- Combo meals
- Buy-1-Take-1 (B1T1) burgers
- Pastries
- Drinks
- Other menu items offered by the café

The project documentation describes approximately 40 weekday customers/sales and lower weekend volume as a client-provided estimate.

---

## 3. Current Situation

Taste It currently has a digital sales process but a fragmented inventory process.

The project documentation describes:

- POS use for sales transactions
- Inventory records maintained through Sheets
- Manual end-of-day inventory counting
- Owner verification of inventory
- Manual investigation of discrepancies
- CCTV review when discrepancies need investigation
- Standard recipes known by staff but not formally documented in a system

The manual inventory process can take approximately one hour and may require overtime.

Inventory shortages can also occur when ingredients are omitted from the fixed restocking request schedule.

---

## 4. Main Operational Problem

The central problem is inventory accuracy and efficiency.

The system is intended to connect:

```text
Sales
 ↓
Recipes
 ↓
Ingredient consumption
 ↓
Inventory
 ↓
Stock status
 ↓
Alerts
 ↓
Reconciliation
 ↓
Reports
```

The purpose is to reduce manual inventory work, improve inventory accuracy, reduce discrepancies, identify stock problems earlier, and provide decision-ready business information.

---

## 5. Proposed Solution

The proposed system is a unified web application for both branches.

It provides:

- POS
- Menu Management
- Recipe Management
- Automatic Inventory Deduction
- Inventory Management
- Inventory Alerts
- Inventory Reconciliation
- Sales Reports
- Inventory Status Reports
- Inventory Reconciliation Reports
- AI Weekly Business Reports
- Receipt generation/printing
- Role-based access
- Branch-restricted staff access

---

## 6. Project Objectives

### General Objective

Develop an AI-assisted Inventory and Sales Management System that improves inventory accuracy, simplifies inventory management, and supports better business decision-making for Taste It Café.

### Specific Objectives

1. Develop a POS system that records completed sales transactions and automatically deducts ingredient quantities from inventory based on predefined recipes.
2. Implement inventory reconciliation that compares system inventory records with physical stock and records necessary adjustments.
3. Monitor stock levels and provide low-stock and out-of-stock alerts.
4. Generate AI-assisted weekly business reports summarizing sales performance, inventory status, and business insights.
5. Provide menu and recipe management so standard recipes can drive automatic inventory deduction.

---

## 7. Core Operational Concept

The most important system behavior is:

```text
Staff completes a POS sale
        ↓
System records the completed sale
        ↓
System finds each sold menu item's recipe
        ↓
System calculates ingredient consumption
        ↓
System deducts ingredient quantities
        ↓
System updates branch inventory
        ↓
System recalculates stock status
        ↓
System generates/updates alerts when necessary
```

This behavior is the foundation for inventory accuracy.

---

## 8. Branch Model

Taste It has two branches:

- Babag
- Marigondon

Each branch maintains its own sales and inventory records.

The Owner can access and switch between branches.

Staff are assigned to a branch and are restricted to that branch.

The project explicitly excludes branch-to-branch inventory transfers and centralized inventory management across branches.

---

## 9. AI Scope

AI is limited to weekly business reporting.

AI Weekly Business Reports are intended to summarize:

- Sales performance
- Inventory status
- Business insights
- Useful weekly comparisons
- Best/low-selling information where supported by the approved requirements

AI must not be presented as:

- Demand forecasting
- Automatic purchasing recommendations
- Recipe generation
- Automatic recipe recommendations

---

## 10. Project Benefits

The intended benefits are:

- Better inventory accuracy
- Reduced manual inventory work
- Reduced inventory discrepancies
- Earlier visibility into shortages
- Better operational monitoring
- Easier reconciliation
- Faster sales recording
- More organized branch-level information
- Decision-ready weekly business reporting

---

## 11. Important Scope Boundary

The application is a frontend prototype for the approved academic system.

Do not expand the project into a general restaurant-management platform.

Features outside the approved scope must not be invented merely because they are common in POS systems.
