# Taste It System --- Modules and Functionality

## 1. Authentication

Purpose: securely authenticate Owners and Staff.

Core functionality:

-   email/password login;
-   session persistence;
-   inactive-account blocking;
-   logout;
-   Staff account setup/invitation.

## 2. Branch Management

Purpose: manage cafe branches and establish the current working branch.

Owner functionality:

-   view branches;
-   add branch;
-   edit branch;
-   deactivate/reactivate branch;
-   open an active branch;
-   switch active branch.

Staff functionality:

-   view assigned branch context;
-   no branch switching.

## 3. Dashboard

Purpose: provide a concise operational overview for the selected branch.

Expected information may include:

-   sales overview;
-   useful quick actions;
-   important stock/operational indicators.

The dashboard should not duplicate every report.

## 4. Menu Management

Includes:

-   menu categories;
-   menu items;
-   prices;
-   active/inactive status;
-   recipe association.

Activation rule:

A menu item cannot become active until an active recipe exists.

## 5. Recipe Management

Includes:

-   ingredients used by a menu item;
-   quantities;
-   units;
-   active recipe.

The recipe defines inventory requirements for one menu-item unit.

## 6. Inventory Management

Includes:

-   inventory master data;
-   branch stock;
-   units;
-   low-stock visibility;
-   stock history;
-   reconciliation.

Direct arbitrary stock editing is not the standard workflow.

## 7. Inventory Reconciliation

Includes:

-   recorded/actual discrepancy;
-   predefined reasons;
-   Other/custom reason;
-   confirmation;
-   historical record.

## 8. POS

Includes:

-   menu selection;
-   cart;
-   recipe fulfillment validation;
-   quantity;
-   payment method;
-   GCash reference number;
-   sale completion.

Inventory deduction must be atomic with sale completion.

## 9. Sales

Includes:

-   completed sale records;
-   sale items;
-   payment information;
-   historical viewing;
-   date filtering as approved.

Refund/cancellation is outside the baseline.

## 10. Staff Management

Owner functionality:

-   invite Staff;
-   view Staff;
-   edit Staff profile/assignment/status;
-   deactivate/reactivate Staff.

Staff cannot manage Staff.

## 11. Reports

Reports should use real system data and support operational
decision-making.

Initial report areas:

-   sales;
-   inventory;
-   reconciliation;
-   menu/product performance;
-   branch-aware summaries.

## 12. Notifications

Includes:

-   operational alerts;
-   low-stock notifications where applicable;
-   read/unread state;
-   historical notification records.

## 13. Settings

Settings should contain approved system/user preferences without
becoming a miscellaneous dumping ground.

## 14. AI Assistant

The AI assistant provides answers grounded in approved Taste It data.

It should be useful for questions such as:

-   sales summaries;
-   inventory status;
-   product performance;
-   branch operational information;
-   other questions supported by available system data.

It must not fabricate data.

## 15. Date Selection

Date filters should be reusable where multiple modules require
historical time filtering.

They must use consistent date semantics across reports, sales, dashboard
data, and history views.
