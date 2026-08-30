# Taste It System --- Project Definition

## 1. Project Identity

**System Name:** Taste It Cafe Management System\
**Project Type:** Academic project intended to be realistically
functional\
**Primary Stack:** React + Supabase + GitHub\
**Timeline:** Approximately two months

Taste It System is a cafe management system for Taste It Cafe. The
system supports cafe operations across branches through role-based
access for Owners and Staff.

## 2. Project Objective

The system will centralize operational information and workflows for
menu management, recipes, branch operations, inventory, reconciliation,
point of sale, sales, staff management, reports, notifications,
settings, and a system-grounded AI assistant.

The system should be practical enough to demonstrate real operational
workflows while remaining appropriately scoped for the project timeline.

## 3. Core Architecture

The application uses:

-   React for the frontend.
-   Supabase for authentication and PostgreSQL database services.
-   Supabase Edge Functions only where privileged server-side operations
    are required.
-   GitHub for source control.

The legacy Express/PostgreSQL backend is not part of the target
architecture.

## 4. Users

The system has two application roles:

-   Owner
-   Staff

All Owners have equal authority within the Owner role.

## 5. Branch Context

The system is branch-specific for operational data.

Owners select an active branch before entering the normal application
shell. Owners may manage branches and switch between active branches.

Staff are assigned to one branch and cannot switch branches.

## 6. Design Direction

The client brand direction uses blue and pink. Final brand hex values
are not yet fixed.

All application colors must therefore use centralized design tokens so
final brand colors can be changed globally.

**Hard visual rule: gradients are not used.**

Placeholder assets may be used until approved client assets are
available.

## 7. Source of Truth

This documentation defines what the system is. Application code must
conform to these documents.

Legacy code, old documentation, mock implementations, and previous
feature experiments are references only unless explicitly retained by
these documents.
