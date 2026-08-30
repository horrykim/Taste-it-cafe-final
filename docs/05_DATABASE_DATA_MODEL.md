# Taste It System --- Database Data Model

## 1. Database Authority

Supabase PostgreSQL is the system database.

The legacy Express/PostgreSQL layer is not the target data-access
architecture.

The Supabase project already established for Taste It is the database
baseline. The actual deployed schema/migrations remain authoritative for
exact implementation details.

## 2. Core Entities

The data model includes the following application tables:

-   branches
-   profiles
-   menu_categories
-   inventory_categories
-   units
-   unit_conversions
-   inventory_items
-   menu_items
-   recipes
-   recipe_ingredients
-   branch_inventory
-   sales
-   sale_items
-   reconciliation_reasons
-   inventory_reconciliations
-   inventory_movements
-   notifications
-   reports
-   ai_business_reports
-   user_preferences

*(Note: `database_test_runs` is a temporary/development database artifact, not an application table.)*

## 3. Data Modeling Principles

### Branch specificity

Operational records that represent branch activity must identify the
applicable branch.

### Authentication identity

Supabase Auth owns credentials. Application profile data belongs in the
application profile table.

### Soft deactivation

Users and branches should use active-status fields rather than
destructive deletion when historical records need to remain.

### Historical records

Sales, inventory history, reconciliation history, and notifications must
remain queryable after related operational entities are deactivated.

### Recipes

A menu item has at most one active recipe in the baseline model.

### Inventory

The current branch stock quantity should be derivable/auditable through
inventory records and transaction history.

## 4. Transactions

Operations that must remain consistent should be implemented atomically
at the database/server layer.

The most important example is sale completion:

``` text
Create/complete sale
        +
Create sale items
        +
Deduct recipe-required inventory
        +
Record payment
```

A failure in required inventory deduction must prevent the sale from
becoming completed.

## 5. Unit Conversion

Unit conversion must be centralized.

The system should distinguish:

-   inventory item's stored/base unit
-   recipe quantity/unit
-   conversion rules between compatible units

Conversion logic must not be duplicated independently inside POS,
recipes, and inventory.

## 6. Constraints

Database constraints and server-side logic should enforce important
invariants where practical, including:

-   unique branch codes
-   valid branch/user relationships
-   valid active recipe relationship
-   nonnegative quantities where appropriate
-   valid sale/payment relationships
-   valid foreign keys

## 7. Row-Level Security

RLS must ensure:

-   authenticated users cannot access unauthorized branches;
-   Staff can access only their assigned branch;
-   Owners can access branches and operational records according to
    Owner permissions;
-   privileged service operations are not exposed to arbitrary browser
    users.

The exact SQL policy implementation belongs to the database
migration/source-of-truth layer.
