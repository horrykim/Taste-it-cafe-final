# Taste It System --- AI Assistant Specification

## 1. Purpose

The AI assistant is an optional but desired system capability intended
to help authorized users understand information already contained in
Taste It System.

## 2. Grounding Rule

**The assistant is grounded in Taste It System data only.**

It must not claim that external information is Taste It operational
data.

If the required information is unavailable, it should say that the
system does not have enough information.

## 3. Data Access

The assistant should access only approved system data through controlled
application/database interfaces.

Do not give the model unrestricted database credentials.

Prefer narrowly defined queries/tools/views.

## 4. Authorization

AI responses must respect the user's role and branch context.

A Staff user must not use the AI assistant to indirectly retrieve
information from another branch.

The AI layer does not bypass RLS or application authorization.

## 5. Appropriate Questions

Examples:

-   What were today's sales for this branch?
-   Which menu items sold the most?
-   Which inventory items are low?
-   What inventory discrepancies were recorded?
-   Summarize recent sales.
-   What products appear to be performing poorly?

These are examples, not an exhaustive final command list.

## 6. Inappropriate Behavior

The assistant must not:

-   invent sales;
-   invent inventory quantities;
-   invent staff activity;
-   expose another branch's information;
-   claim an action was performed when it was not;
-   fabricate unavailable reports.

## 7. Write Actions

The initial AI assistant should be primarily informational.

Any future action-taking capability must require explicit approval and
be separately specified.

## 8. Privacy

Only information necessary for the requested system-grounded response
should be supplied to the model.

Sensitive information should not be exposed unnecessarily.

## 9. Failure Handling

If system data cannot be retrieved, the assistant should provide a clear
limitation rather than hallucinating an answer.

## 10. Implementation Boundary

AI implementation details are subordinate to:

-   authentication;
-   RLS;
-   branch isolation;
-   database correctness;
-   application business rules.

AI must never weaken those controls.
